/**
 * GitLab同步用例服务
 * 负责GitLab数据同步的业务逻辑
 */

import { Injectable, Logger } from '@nestjs/common';
import { IGitLabSyncUseCase } from '../../core/interfaces/gitlab-sync.interface';
import { IGitLabInstanceRepository } from '../../core/interfaces/gitlab-repository.interface';
import { IGitLabApiClient } from '../../core/interfaces/gitlab-api.interface';
import { GitLabConfigService } from '../../infrastructure/config/gitlab-config.service';
import { GitLabCacheService } from '../../infrastructure/cache/gitlab-cache.service';
import { GitLabCacheKeys } from '../../infrastructure/cache/gitlab-cache-keys';
import { SyncResult, SyncStatus, SyncHistory, SyncType } from '../../core/types/sync.types';
import { SyncResult as SyncResultEnum, SyncStatus as SyncStatusEnum } from '../../core/enums/sync.enum';
import { GitLabInstanceNotFoundException } from '../../shared/exceptions/gitlab-instance.exception';
import { GitLabSyncException, GitLabSyncInProgressException } from '../../shared/exceptions/gitlab-sync.exception';

/**
 * GitLab同步用例服务实现
 * 提供GitLab数据同步的业务逻辑
 */
@Injectable()
export class GitLabSyncUseCase implements IGitLabSyncUseCase {
  private readonly logger = new Logger(GitLabSyncUseCase.name);
  private readonly syncStatus = new Map<string, SyncStatus>();

  constructor(
    private readonly instanceRepository: IGitLabInstanceRepository,
    private readonly apiClient: IGitLabApiClient,
    private readonly configService: GitLabConfigService,
    private readonly cacheService: GitLabCacheService,
  ) {}

  /**
   * 执行增量同步
   */
  async executeIncrementalSync(instanceId: string): Promise<SyncResult> {
    try {
      // 检查同步是否正在进�?
      if (this.isSyncInProgress(instanceId)) {
        throw new GitLabSyncInProgressException(instanceId, 'incremental');
      }

      // 获取实例
      const instance = await this.getInstance(instanceId);

      // 更新同步状�?
      this.updateSyncStatus(instanceId, {
        instanceId,
        type: SyncType.INCREMENTAL,
        status: 'running' as any,
        progress: 0,
        totalSteps: 5,
        currentStepNumber: 0,
        startTime: new Date(),
        lastUpdated: new Date(),
      });

      const startTime = new Date();
      let processedCount = 0;
      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      try {
        // 步骤1: 同步项目
        this.updateSyncStatus(instanceId, {
          currentStep: '同步项目',
          currentStepNumber: 1,
          progress: 20,
        });
        const projectResult = await this.syncProjects(instance);
        processedCount += projectResult.processedCount;
        successCount += projectResult.successCount;
        failureCount += projectResult.failureCount;
        skippedCount += projectResult.skippedCount;
        errors.push(...projectResult.errors);

        // 步骤2: 同步用户
        this.updateSyncStatus(instanceId, {
          currentStep: '同步用户',
          currentStepNumber: 2,
          progress: 40,
        });
        const userResult = await this.syncUsers(instance);
        processedCount += userResult.processedCount;
        successCount += userResult.successCount;
        failureCount += userResult.failureCount;
        skippedCount += userResult.skippedCount;
        errors.push(...userResult.errors);

        // 步骤3: 同步问题
        this.updateSyncStatus(instanceId, {
          currentStep: '同步问题',
          currentStepNumber: 3,
          progress: 60,
        });
        const issueResult = await this.syncIssues(instance);
        processedCount += issueResult.processedCount;
        successCount += issueResult.successCount;
        failureCount += issueResult.failureCount;
        skippedCount += issueResult.skippedCount;
        errors.push(...issueResult.errors);

        // 步骤4: 同步合并请求
        this.updateSyncStatus(instanceId, {
          currentStep: '同步合并请求',
          currentStepNumber: 4,
          progress: 80,
        });
        const mrResult = await this.syncMergeRequests(instance);
        processedCount += mrResult.processedCount;
        successCount += mrResult.successCount;
        failureCount += mrResult.failureCount;
        skippedCount += mrResult.skippedCount;
        errors.push(...mrResult.errors);

        // 步骤5: 完成同步
        this.updateSyncStatus(instanceId, {
          currentStep: '完成同步',
          currentStepNumber: 5,
          progress: 100,
        });

        const endTime = new Date();
        const result: SyncResult = {
          result: failureCount > 0 ? SyncResultEnum.PARTIAL : SyncResultEnum.SUCCESS,
          type: SyncType.INCREMENTAL,
          status: SyncStatusEnum.COMPLETED,
          startTime,
          endTime,
          processedCount,
          successCount,
          failureCount,
          skippedCount,
          errors: errors.length > 0 ? errors : undefined,
          statistics: {
            totalTime: endTime.getTime() - startTime.getTime(),
            averageTime: processedCount > 0 ? (endTime.getTime() - startTime.getTime()) / processedCount : 0,
            fastestTime: 0,
            slowestTime: 0,
            successRate: processedCount > 0 ? (successCount / processedCount) * 100 : 0,
            failureRate: processedCount > 0 ? (failureCount / processedCount) * 100 : 0,
            skipRate: processedCount > 0 ? (skippedCount / processedCount) * 100 : 0,
            throughput: processedCount / ((endTime.getTime() - startTime.getTime()) / 1000),
            memoryUsage: 0,
            cpuUsage: 0,
          },
        };

        // 更新最终状�?
        this.updateSyncStatus(instanceId, {
          status: 'completed' as any,
          progress: 100,
          currentStep: '同步完成',
        });

        // 清理缓存
        await this.clearSyncCache(instanceId);

        this.logger.log(`增量同步完成: ${instanceId}, 处理: ${processedCount}, 成功: ${successCount}, 失败: ${failureCount}`);
        return result;
      } catch (error) {
        this.updateSyncStatus(instanceId, {
          status: 'failed' as any,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new GitLabSyncException(`增量同步失败: ${error instanceof Error ? error.message : String(error)}`, { instanceId, error });
      }
    } catch (error) {
      this.logger.error(`执行增量同步失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 执行全量同步
   */
  async executeFullSync(instanceId: string): Promise<SyncResult> {
    try {
      // 检查同步是否正在进�?
      if (this.isSyncInProgress(instanceId)) {
        throw new GitLabSyncInProgressException(instanceId, 'full');
      }

      // 获取实例
      const instance = await this.getInstance(instanceId);

      // 更新同步状�?
      this.updateSyncStatus(instanceId, {
        instanceId,
        type: SyncType.FULL,
        status: 'running' as any,
        progress: 0,
        totalSteps: 6,
        currentStepNumber: 0,
        startTime: new Date(),
        lastUpdated: new Date(),
      });

      const startTime = new Date();
      let processedCount = 0;
      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      try {
        // 步骤1: 清理现有数据
        this.updateSyncStatus(instanceId, {
          currentStep: '清理现有数据',
          currentStepNumber: 1,
          progress: 16,
        });
        await this.clearExistingData(instanceId);

        // 步骤2-6: 执行增量同步
        const incrementalResult = await this.executeIncrementalSync(instanceId);
        processedCount += incrementalResult.processedCount;
        successCount += incrementalResult.successCount;
        failureCount += incrementalResult.failureCount;
        skippedCount += incrementalResult.skippedCount;
        errors.push(...(incrementalResult.errors || []));

        const endTime = new Date();
        const result: SyncResult = {
          result: failureCount > 0 ? SyncResultEnum.PARTIAL : SyncResultEnum.SUCCESS,
          type: SyncType.FULL,
          status: SyncStatusEnum.COMPLETED,
          startTime,
          endTime,
          processedCount,
          successCount,
          failureCount,
          skippedCount,
          errors: errors.length > 0 ? errors : undefined,
          statistics: {
            totalTime: endTime.getTime() - startTime.getTime(),
            averageTime: processedCount > 0 ? (endTime.getTime() - startTime.getTime()) / processedCount : 0,
            fastestTime: 0,
            slowestTime: 0,
            successRate: processedCount > 0 ? (successCount / processedCount) * 100 : 0,
            failureRate: processedCount > 0 ? (failureCount / processedCount) * 100 : 0,
            skipRate: processedCount > 0 ? (skippedCount / processedCount) * 100 : 0,
            throughput: processedCount / ((endTime.getTime() - startTime.getTime()) / 1000),
            memoryUsage: 0,
            cpuUsage: 0,
          },
        };

        this.logger.log(`全量同步完成: ${instanceId}, 处理: ${processedCount}, 成功: ${successCount}, 失败: ${failureCount}`);
        return result;
      } catch (error) {
        this.updateSyncStatus(instanceId, {
          status: 'failed' as any,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new GitLabSyncException(`全量同步失败: ${error instanceof Error ? error.message : String(error)}`, { instanceId, error });
      }
    } catch (error) {
      this.logger.error(`执行全量同步失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 执行用户同步
   */
  async executeUserSync(instanceId: string): Promise<SyncResult> {
    try {
      // 检查同步是否正在进�?
      if (this.isSyncInProgress(instanceId)) {
        throw new GitLabSyncInProgressException(instanceId, 'user');
      }

      // 获取实例
      const instance = await this.getInstance(instanceId);

      // 更新同步状�?
      this.updateSyncStatus(instanceId, {
        instanceId,
        type: SyncType.USER,
        status: 'running' as any,
        progress: 0,
        totalSteps: 1,
        currentStepNumber: 0,
        startTime: new Date(),
        lastUpdated: new Date(),
      });

      const startTime = new Date();

      try {
        // 同步用户
        this.updateSyncStatus(instanceId, {
          currentStep: '同步用户',
          currentStepNumber: 1,
          progress: 50,
        });
        const userResult = await this.syncUsers(instance);

        this.updateSyncStatus(instanceId, {
          currentStep: '同步完成',
          currentStepNumber: 1,
          progress: 100,
          status: 'completed' as any,
        });

        const endTime = new Date();
        const result: SyncResult = {
          result: userResult.failureCount > 0 ? SyncResultEnum.PARTIAL : SyncResultEnum.SUCCESS,
          type: SyncType.USER,
          status: SyncStatusEnum.COMPLETED,
          startTime,
          endTime,
          processedCount: userResult.processedCount,
          successCount: userResult.successCount,
          failureCount: userResult.failureCount,
          skippedCount: userResult.skippedCount,
          errors: userResult.errors.length > 0 ? userResult.errors : undefined,
          statistics: {
            totalTime: endTime.getTime() - startTime.getTime(),
            averageTime: userResult.processedCount > 0 ? (endTime.getTime() - startTime.getTime()) / userResult.processedCount : 0,
            fastestTime: 0,
            slowestTime: 0,
            successRate: userResult.processedCount > 0 ? (userResult.successCount / userResult.processedCount) * 100 : 0,
            failureRate: userResult.processedCount > 0 ? (userResult.failureCount / userResult.processedCount) * 100 : 0,
            skipRate: userResult.processedCount > 0 ? (userResult.skippedCount / userResult.processedCount) * 100 : 0,
            throughput: userResult.processedCount / ((endTime.getTime() - startTime.getTime()) / 1000),
            memoryUsage: 0,
            cpuUsage: 0,
          },
        };

        this.logger.log(`用户同步完成: ${instanceId}, 处理: ${userResult.processedCount}, 成功: ${userResult.successCount}, 失败: ${userResult.failureCount}`);
        return result;
      } catch (error) {
        this.updateSyncStatus(instanceId, {
          status: 'failed' as any,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new GitLabSyncException(`用户同步失败: ${error instanceof Error ? error.message : String(error)}`, { instanceId, error });
      }
    } catch (error) {
      this.logger.error(`执行用户同步失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 获取同步状�?
   */
  async getSyncStatus(instanceId: string): Promise<SyncStatus> {
    const status = this.syncStatus.get(instanceId);
    if (!status) {
      return {
        instanceId,
        type: SyncType.INCREMENTAL,
        status: 'pending' as any,
        progress: 0,
        totalSteps: 0,
        currentStepNumber: 0,
        startTime: new Date(),
        lastUpdated: new Date(),
      };
    }
    return status;
  }

  /**
   * 获取同步历史
   */
  async getSyncHistory(instanceId: string, limit?: number): Promise<SyncHistory[]> {
    try {
      // 这里应该从数据库获取同步历史
      // 暂时返回空数�?
      return [];
    } catch (error) {
      this.logger.error(`获取同步历史失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 停止同步
   */
  async stopSync(instanceId: string): Promise<void> {
    try {
      const status = this.syncStatus.get(instanceId);
      if (status && status.status === 'running') {
        this.updateSyncStatus(instanceId, {
          status: 'cancelled' as any,
          currentStep: '同步已取消',
        });
        this.logger.log(`停止同步: ${instanceId}`);
      }
    } catch (error) {
      this.logger.error(`停止同步失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 重置同步状�?
   */
  async resetSyncStatus(instanceId: string): Promise<void> {
    try {
      this.syncStatus.delete(instanceId);
      await this.clearSyncCache(instanceId);
      this.logger.log(`重置同步状�? ${instanceId}`);
    } catch (error) {
      this.logger.error(`重置同步状态失�? ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 获取实例
   */
  private async getInstance(instanceId: string) {
    const instance = await this.instanceRepository.findById(instanceId);
    if (!instance) {
      throw new GitLabInstanceNotFoundException(instanceId);
    }
    return instance;
  }

  /**
   * 检查同步是否正在进�?
   */
  private isSyncInProgress(instanceId: string): boolean {
    const status = this.syncStatus.get(instanceId);
    return status ? status.status === 'running' : false;
  }

  /**
   * 更新同步状�?
   */
  private updateSyncStatus(instanceId: string, updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatus.get(instanceId) || {
      instanceId,
      type: SyncType.INCREMENTAL,
      status: 'pending' as any,
      progress: 0,
      totalSteps: 0,
      currentStepNumber: 0,
      startTime: new Date(),
      lastUpdated: new Date(),
    };

    const updatedStatus = {
      ...currentStatus,
      ...updates,
      lastUpdated: new Date(),
    };

    this.syncStatus.set(instanceId, updatedStatus);
  }

  /**
   * 同步项目
   */
  private async syncProjects(instance: any): Promise<{ processedCount: number; successCount: number; failureCount: number; skippedCount: number; errors: string[] }> {
    // 实现项目同步逻辑
    return { processedCount: 0, successCount: 0, failureCount: 0, skippedCount: 0, errors: [] };
  }

  /**
   * 同步用户
   */
  private async syncUsers(instance: any): Promise<{ processedCount: number; successCount: number; failureCount: number; skippedCount: number; errors: string[] }> {
    // 实现用户同步逻辑
    return { processedCount: 0, successCount: 0, failureCount: 0, skippedCount: 0, errors: [] };
  }

  /**
   * 同步问题
   */
  private async syncIssues(instance: any): Promise<{ processedCount: number; successCount: number; failureCount: number; skippedCount: number; errors: string[] }> {
    // 实现问题同步逻辑
    return { processedCount: 0, successCount: 0, failureCount: 0, skippedCount: 0, errors: [] };
  }

  /**
   * 同步合并请求
   */
  private async syncMergeRequests(instance: any): Promise<{ processedCount: number; successCount: number; failureCount: number; skippedCount: number; errors: string[] }> {
    // 实现合并请求同步逻辑
    return { processedCount: 0, successCount: 0, failureCount: 0, skippedCount: 0, errors: [] };
  }

  /**
   * 清理现有数据
   */
  private async clearExistingData(instanceId: string): Promise<void> {
    // 实现清理现有数据的逻辑
  }

  /**
   * 清理同步缓存
   */
  private async clearSyncCache(instanceId: string): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      await this.cacheService.delete(GitLabCacheKeys.syncStatus(instanceId));
      await this.cacheService.delete(GitLabCacheKeys.syncHistory(instanceId));
    }
  }
}
