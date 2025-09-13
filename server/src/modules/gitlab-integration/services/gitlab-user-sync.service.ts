import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabUserMapping } from '../entities/gitlab-user-mapping.entity';
import { UserEntity as User } from '../../users/user.entity';
import { GitLabApiService } from './gitlab-api.service';
import { GitLabUser } from '../interfaces/gitlab-api.interface';

// 错误处理辅助函数
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return getErrorMessage(error);
  }
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return getErrorStack(error);
  }
  return undefined;
}


/**
 * GitLab用户同步服务
 * 负责GitLab用户与项目管理工具用户的映射和同步
 */
@Injectable()
export class GitLabUserSyncService {
  private readonly logger = new Logger(GitLabUserSyncService.name);

  constructor(
    @InjectRepository(GitLabUserMapping)
    private readonly userMappingRepository: Repository<GitLabUserMapping>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly gitlabApiService: GitLabApiService,
  ) {}

  /**
   * 同步GitLab用户到项目管理工具
   */
  async syncGitLabUser(
    gitlabUser: GitLabUser,
    instance: GitLabInstance,
  ): Promise<{ success: boolean; user?: User; mapping?: GitLabUserMapping; message: string }> {
    try {
      this.logger.debug(`同步GitLab用户: ${gitlabUser.username}`, {
        instanceId: instance.id,
        gitlabUserId: gitlabUser.id,
        gitlabUsername: gitlabUser.username,
      });

      // 检查是否已存在映射
      let mapping = await this.userMappingRepository.findOne({
        where: {
          gitlabInstanceId: instance.id,
          gitlabUserId: gitlabUser.id,
        },
        relations: ['user'],
      });

      if (mapping) {
        // 更新现有映射
        await this.updateUserMapping(mapping, gitlabUser);
        return {
          success: true,
          user: mapping.user,
          mapping,
          message: `用户映射已更新: ${gitlabUser.username}`,
        };
      }

      // 查找匹配的本地用户
      let localUser = await this.findMatchingLocalUser(gitlabUser);
      
      if (!localUser) {
        // 创建新用户
        localUser = await this.createLocalUser(gitlabUser);
      }

      // 创建用户映射
      mapping = this.userMappingRepository.create({
        gitlabInstanceId: instance.id,
        gitlabUserId: gitlabUser.id,
        gitlabUsername: gitlabUser.username,
        gitlabEmail: gitlabUser.email,
        gitlabName: gitlabUser.name,
        userId: localUser.id,
        isActive: true,
      });

      await this.userMappingRepository.save(mapping);

      this.logger.log(`用户同步成功: ${gitlabUser.username}`, {
        instanceId: instance.id,
        gitlabUserId: gitlabUser.id,
        localUserId: localUser.id,
        mappingId: mapping.id,
      });

      return {
        success: true,
        user: localUser,
        mapping,
        message: `用户同步成功: ${gitlabUser.username}`,
      };

    } catch (error) {
      this.logger.error(`同步GitLab用户失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        gitlabUserId: gitlabUser.id,
        gitlabUsername: gitlabUser.username,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  /**
   * 更新用户映射
   */
  private async updateUserMapping(
    mapping: GitLabUserMapping,
    gitlabUser: GitLabUser,
  ): Promise<void> {
    mapping.gitlabUsername = gitlabUser.username;
    mapping.gitlabEmail = gitlabUser.email;
    mapping.gitlabName = gitlabUser.name;
    mapping.lastSyncAt = new Date();
    
    await this.userMappingRepository.save(mapping);
  }

  /**
   * 查找匹配的本地用户
   */
  private async findMatchingLocalUser(gitlabUser: GitLabUser): Promise<User | null> {
    // 按邮箱查找
    if (gitlabUser.email) {
      const userByEmail = await this.userRepository.findOne({
        where: { email: gitlabUser.email },
      });
      if (userByEmail) {
        return userByEmail;
      }
    }

    // 按用户名查找
    const userByUsername = await this.userRepository.findOne({
      where: { email: gitlabUser.email },
    });
    if (userByUsername) {
      return userByUsername;
    }

    // 按显示名称查找
    if (gitlabUser.name) {
      const userByName = await this.userRepository.findOne({
        where: { displayName: gitlabUser.name },
      });
      if (userByName) {
        return userByName;
      }
    }

    return null;
  }

  /**
   * 创建本地用户
   */
  private async createLocalUser(gitlabUser: GitLabUser): Promise<User> {
    const user = this.userRepository.create({
      name: gitlabUser.name || gitlabUser.username,
      email: gitlabUser.email || `${gitlabUser.username}@gitlab.local`,
      displayName: gitlabUser.name || gitlabUser.username,
      status: 'active',
      systemRoles: ['user'], // 默认角色
      avatar: gitlabUser.avatar_url,
    });

    return this.userRepository.save(user);
  }

  /**
   * 根据GitLab用户ID获取本地用户
   */
  async getLocalUserByGitLabId(
    instanceId: string,
    gitlabUserId: number,
  ): Promise<User | null> {
    const mapping = await this.userMappingRepository.findOne({
      where: {
        gitlabInstanceId: instanceId,
        gitlabUserId: gitlabUserId,
        isActive: true,
      },
      relations: ['user'],
    });

    return mapping?.user || null;
  }

  /**
   * 根据GitLab用户名获取本地用户
   */
  async getLocalUserByGitLabUsername(
    instanceId: string,
    gitlabUsername: string,
  ): Promise<User | null> {
    const mapping = await this.userMappingRepository.findOne({
      where: {
        gitlabInstanceId: instanceId,
        gitlabUsername: gitlabUsername,
        isActive: true,
      },
      relations: ['user'],
    });

    return mapping?.user || null;
  }

  /**
   * 批量同步用户
   */
  async syncUsersFromGitLab(instance: GitLabInstance): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ success: boolean; message: string; user?: User }>;
  }> {
    try {
      this.logger.log(`开始批量同步用户: ${instance.name}`, {
        instanceId: instance.id,
      });

      // 获取GitLab用户列表
      const gitlabUsers = await this.gitlabApiService.getUsers(instance);
      
      const results = [];
      let successful = 0;
      let failed = 0;

      for (const gitlabUser of gitlabUsers) {
        const result = await this.syncGitLabUser(gitlabUser, instance);
        results.push({
          success: result.success,
          message: result.message,
          user: result.user,
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }

      this.logger.log(`批量同步用户完成: ${instance.name}`, {
        instanceId: instance.id,
        total: gitlabUsers.length,
        successful,
        failed,
      });

      return {
        total: gitlabUsers.length,
        successful,
        failed,
        results,
      };

    } catch (error) {
      this.logger.error(`批量同步用户失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        error: getErrorStack(error),
      });

      return {
        total: 0,
        successful: 0,
        failed: 1,
        results: [{
          success: false,
          message: getErrorMessage(error),
        }],
      };
    }
  }

  /**
   * 获取用户映射统计
   */
  async getUserMappingStatistics(instanceId?: string): Promise<{
    totalMappings: number;
    activeMappings: number;
    inactiveMappings: number;
    lastSyncTime?: Date;
  }> {
    const whereCondition = instanceId ? { gitlabInstanceId: instanceId } : {};
    
    const [totalMappings, activeMappings, inactiveMappings] = await Promise.all([
      this.userMappingRepository.count({ where: whereCondition }),
      this.userMappingRepository.count({ where: { ...whereCondition, isActive: true } }),
      this.userMappingRepository.count({ where: { ...whereCondition, isActive: false } }),
    ]);

    // 获取最后同步时间
    const lastMapping = await this.userMappingRepository.findOne({
      where: whereCondition,
      order: { lastSyncAt: 'DESC' },
    });

    return {
      totalMappings,
      activeMappings,
      inactiveMappings,
      lastSyncTime: lastMapping?.lastSyncAt,
    };
  }

  /**
   * 清理无效的用户映射
   */
  async cleanupInvalidMappings(instance: GitLabInstance): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    try {
      this.logger.log(`开始清理无效用户映射: ${instance.name}`, {
        instanceId: instance.id,
      });

      const mappings = await this.userMappingRepository.find({
        where: {
          gitlabInstanceId: instance.id,
          isActive: true,
        },
      });

      const errors: string[] = [];
      let cleaned = 0;

      for (const mapping of mappings) {
        try {
          // 检查GitLab用户是否仍然存在
          const gitlabUser = await this.gitlabApiService.getUser(instance, mapping.gitlabUserId);
          
          if (!gitlabUser) {
            // 用户不存在，标记为无效
            mapping.isActive = false;
            mapping.deactivatedAt = new Date();
            await this.userMappingRepository.save(mapping);
            cleaned++;
          }
        } catch (error) {
          // 如果获取用户失败，也标记为无效
          mapping.isActive = false;
          mapping.deactivatedAt = new Date();
          await this.userMappingRepository.save(mapping);
          cleaned++;
          errors.push(`用户 ${mapping.gitlabUsername} 清理失败: ${getErrorMessage(error)}`);
        }
      }

      this.logger.log(`清理无效用户映射完成: ${instance.name}`, {
        instanceId: instance.id,
        cleaned,
        errors: errors.length,
      });

      return {
        cleaned,
        errors,
      };

    } catch (error) {
      this.logger.error(`清理无效用户映射失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        error: getErrorStack(error),
      });

      return {
        cleaned: 0,
        errors: [getErrorMessage(error)],
      };
    }
  }
}
