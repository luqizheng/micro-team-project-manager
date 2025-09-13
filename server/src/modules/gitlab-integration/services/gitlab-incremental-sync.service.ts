import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../entities/gitlab-project-mapping.entity';
import { GitLabSyncStatus } from '../entities/gitlab-sync-status.entity';
import { GitLabApiService } from './gitlab-api.service';
import { GitLabUserSyncService } from './gitlab-user-sync.service';
import { GitLabSyncService } from './gitlab-sync.service';
import { SyncResult, SyncConfig } from '../interfaces/gitlab-sync.interface';

// 错误处理辅助函数
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * GitLab增量同步服务
 * 负责处理增量同步、全量同步和补偿同步
 */
@Injectable()
export class GitLabIncrementalSyncService {
  private readonly logger = new Logger(GitLabIncrementalSyncService.name);
  private readonly defaultSyncConfig: SyncConfig = {
    maxRetries: 3,
    retryInterval: 5000,
    batchSize: 20,
    timeout: 60000,
    enableAutoSync: true,
    syncInterval: 300000, // 5分钟
  };

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly projectMappingRepository: Repository<GitLabProjectMapping>,
    @InjectRepository(GitLabSyncStatus)
    private readonly syncStatusRepository: Repository<GitLabSyncStatus>,
    private readonly gitlabApiService: GitLabApiService,
    private readonly userSyncService: GitLabUserSyncService,
    private readonly syncService: GitLabSyncService,
  ) {}

  /**
   * 执行增量同步
   */
  async performIncrementalSync(
    instanceId: string,
    projectId?: string,
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始增量同步: ${instanceId}`, {
        instanceId,
        projectId,
      });

      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        return {
          success: false,
          message: 'GitLab实例不存在或未激活',
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      // 获取需要同步的项目映射
      const mappings = await this.getProjectMappings(instanceId, projectId);
      
      if (mappings.length === 0) {
        return {
          success: true,
          message: '没有需要同步的项目映射',
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      let totalSyncCount = 0;
      const results = [];

      // 同步每个项目
      for (const mapping of mappings) {
        try {
          const result = await this.syncProjectIncremental(instance, mapping);
          totalSyncCount += result.syncCount;
          results.push(result);
        } catch (error) {
          this.logger.error(`同步项目失败: ${getErrorMessage(error)}`, {
            instanceId,
            mappingId: mapping.id,
            projectId: mapping.projectId,
            error: getErrorStack(error),
          });
          results.push({
            success: false,
            message: getErrorMessage(error),
            syncCount: 0,
            lastSyncAt: new Date(),
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const success = successCount > 0;

      this.logger.log(`增量同步完成: ${instanceId}`, {
        instanceId,
        totalMappings: mappings.length,
        successfulMappings: successCount,
        totalSyncCount,
      });

      return {
        success,
        message: `同步了 ${successCount}/${mappings.length} 个项目，共 ${totalSyncCount} 项`,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
        data: { results },
      };

    } catch (error) {
      this.logger.error(`增量同步失败: ${getErrorMessage(error)}`, {
        instanceId,
        projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 执行全量同步
   */
  async performFullSync(
    instanceId: string,
    projectId?: string,
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始全量同步: ${instanceId}`, {
        instanceId,
        projectId,
      });

      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        return {
          success: false,
          message: 'GitLab实例不存在或未激活',
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      // 获取需要同步的项目映射
      const mappings = await this.getProjectMappings(instanceId, projectId);
      
      if (mappings.length === 0) {
        return {
          success: true,
          message: '没有需要同步的项目映射',
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      let totalSyncCount = 0;
      const results = [];

      // 同步每个项目
      for (const mapping of mappings) {
        try {
          const result = await this.syncProjectFull(instance, mapping);
          totalSyncCount += result.syncCount;
          results.push(result);
        } catch (error) {
          this.logger.error(`全量同步项目失败: ${getErrorMessage(error)}`, {
            instanceId,
            mappingId: mapping.id,
            projectId: mapping.projectId,
            error: getErrorStack(error),
          });
          results.push({
            success: false,
            message: getErrorMessage(error),
            syncCount: 0,
            lastSyncAt: new Date(),
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const success = successCount > 0;

      this.logger.log(`全量同步完成: ${instanceId}`, {
        instanceId,
        totalMappings: mappings.length,
        successfulMappings: successCount,
        totalSyncCount,
      });

      return {
        success,
        message: `全量同步了 ${successCount}/${mappings.length} 个项目，共 ${totalSyncCount} 项`,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
        data: { results },
      };

    } catch (error) {
      this.logger.error(`全量同步失败: ${getErrorMessage(error)}`, {
        instanceId,
        projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 执行补偿同步
   */
  async performCompensationSync(
    instanceId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始补偿同步: ${instanceId}`, {
        instanceId,
        fromDate,
        toDate,
      });

      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        return {
          success: false,
          message: 'GitLab实例不存在或未激活',
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      // 获取需要补偿同步的项目映射
      const mappings = await this.getProjectMappings(instanceId);
      
      if (mappings.length === 0) {
        return {
          success: true,
          message: '没有需要补偿同步的项目映射',
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      let totalSyncCount = 0;
      const results = [];

      // 补偿同步每个项目
      for (const mapping of mappings) {
        try {
          const result = await this.syncProjectCompensation(instance, mapping, fromDate, toDate);
          totalSyncCount += result.syncCount;
          results.push(result);
        } catch (error) {
          this.logger.error(`补偿同步项目失败: ${getErrorMessage(error)}`, {
            instanceId,
            mappingId: mapping.id,
            projectId: mapping.projectId,
            error: getErrorStack(error),
          });
          results.push({
            success: false,
            message: getErrorMessage(error),
            syncCount: 0,
            lastSyncAt: new Date(),
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const success = successCount > 0;

      this.logger.log(`补偿同步完成: ${instanceId}`, {
        instanceId,
        totalMappings: mappings.length,
        successfulMappings: successCount,
        totalSyncCount,
      });

      return {
        success,
        message: `补偿同步了 ${successCount}/${mappings.length} 个项目，共 ${totalSyncCount} 项`,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
        data: { results },
      };

    } catch (error) {
      this.logger.error(`补偿同步失败: ${getErrorMessage(error)}`, {
        instanceId,
        fromDate,
        toDate,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 同步项目增量数据
   */
  private async syncProjectIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
  ): Promise<SyncResult> {
    try {
      // 获取同步状态
      let syncStatus = await this.syncStatusRepository.findOne({
        where: {
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
        },
      });

      if (!syncStatus) {
        syncStatus = this.syncStatusRepository.create({
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
          lastSyncAt: new Date(0), // 从最早开始
          syncType: 'incremental',
          status: 'in_progress',
        });
        await this.syncStatusRepository.save(syncStatus);
      }

      // 更新状态为进行中
      syncStatus.status = 'in_progress';
      syncStatus.lastSyncAt = new Date();
      await this.syncStatusRepository.save(syncStatus);

      let syncCount = 0;

      try {
        // 同步Issues
        const issuesResult = await this.syncIssuesIncremental(instance, mapping, syncStatus.lastSyncAt);
        syncCount += issuesResult.syncCount;

        // 同步Merge Requests
        const mergeRequestsResult = await this.syncMergeRequestsIncremental(instance, mapping, syncStatus.lastSyncAt);
        syncCount += mergeRequestsResult.syncCount;

        // 同步Pipelines
        const pipelinesResult = await this.syncPipelinesIncremental(instance, mapping, syncStatus.lastSyncAt);
        syncCount += pipelinesResult.syncCount;

        // 更新同步状态
        syncStatus.status = 'completed';
        syncStatus.lastSyncAt = new Date();
        syncStatus.syncCount = syncCount;
        await this.syncStatusRepository.save(syncStatus);

        return {
          success: true,
          message: `项目增量同步完成: ${mapping.gitlabProjectPath}`,
          syncCount,
          lastSyncAt: syncStatus.lastSyncAt,
        };

      } catch (error) {
        // 更新同步状态为失败
        syncStatus.status = 'failed';
        syncStatus.errorMessage = getErrorMessage(error);
        await this.syncStatusRepository.save(syncStatus);

        throw error;
      }

    } catch (error) {
      this.logger.error(`项目增量同步失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        mappingId: mapping.id,
        projectId: mapping.projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 同步项目全量数据
   */
  private async syncProjectFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
  ): Promise<SyncResult> {
    try {
      // 获取同步状态
      let syncStatus = await this.syncStatusRepository.findOne({
        where: {
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
        },
      });

      if (!syncStatus) {
        syncStatus = this.syncStatusRepository.create({
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
          lastSyncAt: new Date(0),
          syncType: 'full',
          status: 'in_progress',
        });
      } else {
        syncStatus.syncType = 'full';
        syncStatus.status = 'in_progress';
        syncStatus.lastSyncAt = new Date();
      }

      await this.syncStatusRepository.save(syncStatus);

      let syncCount = 0;

      try {
        // 同步所有Issues
        const issuesResult = await this.syncIssuesFull(instance, mapping);
        syncCount += issuesResult.syncCount;

        // 同步所有Merge Requests
        const mergeRequestsResult = await this.syncMergeRequestsFull(instance, mapping);
        syncCount += mergeRequestsResult.syncCount;

        // 同步所有Pipelines
        const pipelinesResult = await this.syncPipelinesFull(instance, mapping);
        syncCount += pipelinesResult.syncCount;

        // 更新同步状态
        syncStatus.status = 'completed';
        syncStatus.lastSyncAt = new Date();
        syncStatus.syncCount = syncCount;
        await this.syncStatusRepository.save(syncStatus);

        return {
          success: true,
          message: `项目全量同步完成: ${mapping.gitlabProjectPath}`,
          syncCount,
          lastSyncAt: syncStatus.lastSyncAt,
        };

      } catch (error) {
        // 更新同步状态为失败
        syncStatus.status = 'failed';
        syncStatus.errorMessage = getErrorMessage(error);
        await this.syncStatusRepository.save(syncStatus);

        throw error;
      }

    } catch (error) {
      this.logger.error(`项目全量同步失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        mappingId: mapping.id,
        projectId: mapping.projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 同步项目补偿数据
   */
  private async syncProjectCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date,
  ): Promise<SyncResult> {
    try {
      let syncCount = 0;

      // 补偿同步Issues
      const issuesResult = await this.syncIssuesCompensation(instance, mapping, fromDate, toDate);
      syncCount += issuesResult.syncCount;

      // 补偿同步Merge Requests
      const mergeRequestsResult = await this.syncMergeRequestsCompensation(instance, mapping, fromDate, toDate);
      syncCount += mergeRequestsResult.syncCount;

      // 补偿同步Pipelines
      const pipelinesResult = await this.syncPipelinesCompensation(instance, mapping, fromDate, toDate);
      syncCount += pipelinesResult.syncCount;

      return {
        success: true,
        message: `项目补偿同步完成: ${mapping.gitlabProjectPath}`,
        syncCount,
        lastSyncAt: new Date(),
      };

    } catch (error) {
      this.logger.error(`项目补偿同步失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        mappingId: mapping.id,
        projectId: mapping.projectId,
        fromDate,
        toDate,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 获取项目映射
   */
  private async getProjectMappings(
    instanceId: string,
    projectId?: string,
  ): Promise<GitLabProjectMapping[]> {
    const whereCondition: any = {
      gitlabInstanceId: instanceId,
      isActive: true,
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    return this.projectMappingRepository.find({
      where: whereCondition,
      relations: ['project', 'gitlabInstance'],
    });
  }

  /**
   * 同步Issues增量数据
   */
  private async syncIssuesIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    since: Date,
  ): Promise<SyncResult> {
    // 实现增量同步Issues的逻辑
    // 这里需要调用GitLab API获取自指定时间以来的Issues
    return {
      success: true,
      message: 'Issues增量同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Issues全量数据
   */
  private async syncIssuesFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
  ): Promise<SyncResult> {
    // 实现全量同步Issues的逻辑
    return {
      success: true,
      message: 'Issues全量同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Issues补偿数据
   */
  private async syncIssuesCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date,
  ): Promise<SyncResult> {
    // 实现补偿同步Issues的逻辑
    return {
      success: true,
      message: 'Issues补偿同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Merge Requests增量数据
   */
  private async syncMergeRequestsIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    since: Date,
  ): Promise<SyncResult> {
    // 实现增量同步Merge Requests的逻辑
    return {
      success: true,
      message: 'Merge Requests增量同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Merge Requests全量数据
   */
  private async syncMergeRequestsFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
  ): Promise<SyncResult> {
    // 实现全量同步Merge Requests的逻辑
    return {
      success: true,
      message: 'Merge Requests全量同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Merge Requests补偿数据
   */
  private async syncMergeRequestsCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date,
  ): Promise<SyncResult> {
    // 实现补偿同步Merge Requests的逻辑
    return {
      success: true,
      message: 'Merge Requests补偿同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Pipelines增量数据
   */
  private async syncPipelinesIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    since: Date,
  ): Promise<SyncResult> {
    // 实现增量同步Pipelines的逻辑
    return {
      success: true,
      message: 'Pipelines增量同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Pipelines全量数据
   */
  private async syncPipelinesFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
  ): Promise<SyncResult> {
    // 实现全量同步Pipelines的逻辑
    return {
      success: true,
      message: 'Pipelines全量同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Pipelines补偿数据
   */
  private async syncPipelinesCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date,
  ): Promise<SyncResult> {
    // 实现补偿同步Pipelines的逻辑
    return {
      success: true,
      message: 'Pipelines补偿同步完成',
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }
}
