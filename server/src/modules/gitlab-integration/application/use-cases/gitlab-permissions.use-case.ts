/**
 * GitLab权限用例服务
 * 负责GitLab权限管理的业务逻辑
 */

import { Injectable, Logger } from '@nestjs/common';
import { IGitLabPermissionsUseCase, PermissionInfo } from '../../core/interfaces/gitlab-permissions.interface';
import { IGitLabInstanceRepository } from '../../core/interfaces/gitlab-repository.interface';
import { IGitLabProjectMappingRepository } from '../../core/interfaces/gitlab-repository.interface';
import { GitLabConfigService } from '../../infrastructure/config/gitlab-config.service';
import { GitLabCacheService } from '../../infrastructure/cache/gitlab-cache.service';
import { GitLabCacheKeys } from '../../infrastructure/cache/gitlab-cache-keys';
import { GitLabInstanceNotFoundException } from '../../shared/exceptions/gitlab-instance.exception';
import { GitLabPermissionException, GitLabPermissionDeniedException, GitLabInsufficientPermissionsException } from '../../shared/exceptions/gitlab-permission.exception';

/**
 * GitLab权限用例服务实现
 * 提供GitLab权限管理的业务逻辑
 */
@Injectable()
export class GitLabPermissionsUseCase implements IGitLabPermissionsUseCase {
  private readonly logger = new Logger(GitLabPermissionsUseCase.name);
  private readonly permissions = new Map<string, PermissionInfo[]>();

  constructor(
    private readonly instanceRepository: IGitLabInstanceRepository,
    private readonly projectMappingRepository: IGitLabProjectMappingRepository,
    private readonly configService: GitLabConfigService,
    private readonly cacheService: GitLabCacheService,
  ) {}

  /**
   * 检查实例权限
   */
  async checkInstancePermissions(instanceId: string, userId: string): Promise<boolean> {
    try {
      // 检查实例是否存在
      const instance = await this.instanceRepository.findById(instanceId);
      if (!instance) {
        throw new GitLabInstanceNotFoundException(instanceId);
      }

      // 检查用户权限
      const userPermissions = await this.getUserPermissions(userId);
      const hasPermission = userPermissions.some(
        permission => permission.type === 'instance' && permission.resourceId === instanceId
      );

      this.logger.debug(`检查实例权限: ${userId} -> ${instanceId}, 结果: ${hasPermission}`);
      return hasPermission;
    } catch (error) {
      this.logger.error(`检查实例权限失败: ${userId} -> ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 检查项目权限
   */
  async checkProjectPermissions(projectId: string, userId: string): Promise<boolean> {
    try {
      // 检查项目映射是否存在
      const mapping = await this.projectMappingRepository.findByProjectId(projectId);
      if (!mapping) {
        return false;
      }

      // 检查用户权限
      const userPermissions = await this.getUserPermissions(userId);
      const hasPermission = userPermissions.some(
        permission => permission.type === 'project' && permission.resourceId === projectId
      );

      this.logger.debug(`检查项目权限: ${userId} -> ${projectId}, 结果: ${hasPermission}`);
      return hasPermission;
    } catch (error) {
      this.logger.error(`检查项目权限失败: ${userId} -> ${projectId}`, error);
      throw error;
    }
  }

  /**
   * 授予实例访问权限
   */
  async grantInstanceAccess(instanceId: string, userId: string): Promise<void> {
    try {
      // 检查实例是否存在
      const instance = await this.instanceRepository.findById(instanceId);
      if (!instance) {
        throw new GitLabInstanceNotFoundException(instanceId);
      }

      // 检查权限是否已存在
      const existingPermission = await this.getUserPermission(userId, 'instance', instanceId);
      if (existingPermission) {
        this.logger.warn(`实例权限已存在: ${userId} -> ${instanceId}`);
        return;
      }

      // 创建权限
      const permission: PermissionInfo = {
        id: this.generatePermissionId(),
        type: 'instance',
        resourceId: instanceId,
        userId,
        level: 'read',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.savePermission(permission);

      // 清理缓存
      await this.clearUserPermissionCache(userId);

      this.logger.log(`授予实例访问权限: ${userId} -> ${instanceId}`);
    } catch (error) {
      this.logger.error(`授予实例访问权限失败: ${userId} -> ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 撤销实例访问权限
   */
  async revokeInstanceAccess(instanceId: string, userId: string): Promise<void> {
    try {
      // 检查权限是否存在
      const existingPermission = await this.getUserPermission(userId, 'instance', instanceId);
      if (!existingPermission) {
        this.logger.warn(`实例权限不存在: ${userId} -> ${instanceId}`);
        return;
      }

      // 删除权限
      await this.deletePermission(existingPermission.id);

      // 清理缓存
      await this.clearUserPermissionCache(userId);

      this.logger.log(`撤销实例访问权限: ${userId} -> ${instanceId}`);
    } catch (error) {
      this.logger.error(`撤销实例访问权限失败: ${userId} -> ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 授予项目访问权限
   */
  async grantProjectAccess(projectId: string, userId: string): Promise<void> {
    try {
      // 检查项目映射是否存在
      const mapping = await this.projectMappingRepository.findByProjectId(projectId);
      if (!mapping) {
        throw new GitLabPermissionException(`项目映射不存在: ${projectId}`);
      }

      // 检查权限是否已存在
      const existingPermission = await this.getUserPermission(userId, 'project', projectId);
      if (existingPermission) {
        this.logger.warn(`项目权限已存在: ${userId} -> ${projectId}`);
        return;
      }

      // 创建权限
      const permission: PermissionInfo = {
        id: this.generatePermissionId(),
        type: 'project',
        resourceId: projectId,
        userId,
        level: 'read',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.savePermission(permission);

      // 清理缓存
      await this.clearUserPermissionCache(userId);

      this.logger.log(`授予项目访问权限: ${userId} -> ${projectId}`);
    } catch (error) {
      this.logger.error(`授予项目访问权限失败: ${userId} -> ${projectId}`, error);
      throw error;
    }
  }

  /**
   * 撤销项目访问权限
   */
  async revokeProjectAccess(projectId: string, userId: string): Promise<void> {
    try {
      // 检查权限是否存在
      const existingPermission = await this.getUserPermission(userId, 'project', projectId);
      if (!existingPermission) {
        this.logger.warn(`项目权限不存在: ${userId} -> ${projectId}`);
        return;
      }

      // 删除权限
      await this.deletePermission(existingPermission.id);

      // 清理缓存
      await this.clearUserPermissionCache(userId);

      this.logger.log(`撤销项目访问权限: ${userId} -> ${projectId}`);
    } catch (error) {
      this.logger.error(`撤销项目访问权限失败: ${userId} -> ${projectId}`, error);
      throw error;
    }
  }

  /**
   * 获取用户权限列表
   */
  async getUserPermissions(userId: string): Promise<PermissionInfo[]> {
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cacheKey = GitLabCacheKeys.permissions(userId);
        const cached = await this.cacheService.get<PermissionInfo[]>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取用户权限: ${userId}`);
          return cached;
        }
      }

      // 从内存获取（实际应该从数据库获取）
      const permissions = this.permissions.get(userId) || [];

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        const cacheKey = GitLabCacheKeys.permissions(userId);
        await this.cacheService.set(cacheKey, permissions, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取用户权限: ${userId}, 数量: ${permissions.length}`);
      return permissions;
    } catch (error) {
      this.logger.error(`获取用户权限失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 获取实例权限列表
   */
  async getInstancePermissions(instanceId: string): Promise<PermissionInfo[]> {
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cacheKey = GitLabCacheKeys.instancePermissions(instanceId);
        const cached = await this.cacheService.get<PermissionInfo[]>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取实例权限: ${instanceId}`);
          return cached;
        }
      }

      // 从内存获取（实际应该从数据库获取）
      const allPermissions = Array.from(this.permissions.values()).flat();
      const permissions = allPermissions.filter(
        permission => permission.type === 'instance' && permission.resourceId === instanceId
      );

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        const cacheKey = GitLabCacheKeys.instancePermissions(instanceId);
        await this.cacheService.set(cacheKey, permissions, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取实例权限: ${instanceId}, 数量: ${permissions.length}`);
      return permissions;
    } catch (error) {
      this.logger.error(`获取实例权限失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 获取用户特定权限
   */
  private async getUserPermission(userId: string, type: 'instance' | 'project', resourceId: string): Promise<PermissionInfo | null> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.find(
      permission => permission.type === type && permission.resourceId === resourceId
    ) || null;
  }

  /**
   * 保存权限
   */
  private async savePermission(permission: PermissionInfo): Promise<void> {
    const userPermissions = this.permissions.get(permission.userId) || [];
    userPermissions.push(permission);
    this.permissions.set(permission.userId, userPermissions);
  }

  /**
   * 删除权限
   */
  private async deletePermission(permissionId: string): Promise<void> {
    for (const [userId, permissions] of this.permissions.entries()) {
      const index = permissions.findIndex(p => p.id === permissionId);
      if (index !== -1) {
        permissions.splice(index, 1);
        this.permissions.set(userId, permissions);
        break;
      }
    }
  }

  /**
   * 生成权限ID
   */
  private generatePermissionId(): string {
    return `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理用户权限缓存
   */
  private async clearUserPermissionCache(userId: string): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      await this.cacheService.delete(GitLabCacheKeys.permissions(userId));
    }
  }

  /**
   * 清理实例权限缓存
   */
  private async clearInstancePermissionCache(instanceId: string): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      await this.cacheService.delete(GitLabCacheKeys.instancePermissions(instanceId));
    }
  }

  /**
   * 清理项目权限缓存
   */
  private async clearProjectPermissionCache(projectId: string): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      await this.cacheService.delete(GitLabCacheKeys.projectPermissions(projectId));
    }
  }
}
