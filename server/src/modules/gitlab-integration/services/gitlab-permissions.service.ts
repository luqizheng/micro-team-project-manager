import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../entities/gitlab-project-mapping.entity';
import { ProjectEntity as Project } from '../../projects/project.entity';
import { UserEntity as User } from '../../users/user.entity';
import { GitLabPermissionsList, hasPermission, RolePermissions } from '../decorators/gitlab-permissions.decorator';

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
 * GitLab集成权限服务
 * 负责处理GitLab集成功能的权限检查和验证
 */
@Injectable()
export class GitLabPermissionsService {
  private readonly logger = new Logger(GitLabPermissionsService.name);

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly projectMappingRepository: Repository<GitLabProjectMapping>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 检查用户是否具有指定权限
   */
  async checkPermission(
    userId: string,
    permission: string,
    context?: {
      instanceId?: string;
      projectId?: string;
      mappingId?: string;
    },
  ): Promise<boolean> {
    try {
      // 获取用户信息
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`用户不存在: ${userId}`);
        return false;
      }

      // 解析权限
      const [action, resource] = permission.split(':');
      if (!action || !resource) {
        this.logger.warn(`无效的权限格式: ${permission}`);
        return false;
      }

      // 检查基本权限
      const hasBasicPermission = this.hasBasicPermission(user.systemRoles?.[0] || 'user', action, resource);
      if (!hasBasicPermission) {
        this.logger.debug(`用户 ${userId} 缺少基本权限: ${permission}`, {
          userId,
          userRole: user.systemRoles?.[0] || 'user',
          permission,
        });
        return false;
      }

      // 检查上下文相关权限
      if (context) {
        const hasContextPermission = await this.checkContextPermission(user, action, resource, context);
        if (!hasContextPermission) {
          this.logger.debug(`用户 ${userId} 缺少上下文权限: ${permission}`, {
            userId,
            userRole: user.systemRoles?.[0] || 'user',
            permission,
            context,
          });
          return false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error(`检查权限失败: ${getErrorMessage(error)}`, {
        userId,
        permission,
        context,
        error: getErrorStack(error),
      });
      return false;
    }
  }

  /**
   * 检查用户是否具有基本权限
   */
  private hasBasicPermission(userRole: string, action: string, resource: string): boolean {
    const rolePermissions = (RolePermissions as any)[userRole] || [];
    
    return rolePermissions.some((rolePermission: any) => 
      rolePermission.action === action &&
      rolePermission.resource === resource
    );
  }

  /**
   * 检查上下文相关权限
   */
  private async checkContextPermission(
    user: User,
    action: string,
    resource: string,
    context: {
      instanceId?: string;
      projectId?: string;
      mappingId?: string;
    },
  ): Promise<boolean> {
    try {
      // 检查实例权限
      if (context.instanceId) {
        const hasInstanceAccess = await this.checkInstanceAccess(user, context.instanceId);
        if (!hasInstanceAccess) {
          return false;
        }
      }

      // 检查项目权限
      if (context.projectId) {
        const hasProjectAccess = await this.checkProjectAccess(user, context.projectId);
        if (!hasProjectAccess) {
          return false;
        }
      }

      // 检查映射权限
      if (context.mappingId) {
        const hasMappingAccess = await this.checkMappingAccess(user, context.mappingId);
        if (!hasMappingAccess) {
          return false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error(`检查上下文权限失败: ${getErrorMessage(error)}`, {
        userId: user.id,
        action,
        resource,
        context,
        error: getErrorStack(error),
      });
      return false;
    }
  }

  /**
   * 检查用户是否有实例访问权限
   */
  private async checkInstanceAccess(user: User, instanceId: string): Promise<boolean> {
    // 系统管理员拥有所有实例权限
    if ((user.systemRoles?.[0] || 'user') === 'admin') {
      return true;
    }

    // 检查实例是否存在
    const instance = await this.instanceRepository.findOne({
      where: { id: instanceId },
    });

    if (!instance) {
      this.logger.warn(`GitLab实例不存在: ${instanceId}`);
      return false;
    }

    // 其他角色需要检查具体的实例权限
    // 这里可以扩展更细粒度的权限控制
    return false;
  }

  /**
   * 检查用户是否有项目访问权限
   */
  private async checkProjectAccess(user: User, projectId: string): Promise<boolean> {
    // 系统管理员拥有所有项目权限
    if ((user.systemRoles?.[0] || 'user') === 'admin') {
      return true;
    }

    // 检查项目是否存在
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.warn(`项目不存在: ${projectId}`);
      return false;
    }

    // 项目管理员拥有项目权限
    if ((user.systemRoles?.[0] || 'user') === 'project_manager') {
      // 这里需要检查用户是否是项目的管理员
      // 简化实现，假设项目管理员有权限
      return true;
    }

    // 普通用户无权限
    return false;
  }

  /**
   * 检查用户是否有映射访问权限
   */
  private async checkMappingAccess(user: User, mappingId: string): Promise<boolean> {
    // 系统管理员拥有所有映射权限
    if ((user.systemRoles?.[0] || 'user') === 'admin') {
      return true;
    }

    // 检查映射是否存在
    const mapping = await this.projectMappingRepository.findOne({
      where: { id: mappingId },
      relations: ['project'],
    });

    if (!mapping) {
      this.logger.warn(`项目映射不存在: ${mappingId}`);
      return false;
    }

    // 检查项目权限
    return this.checkProjectAccess(user, mapping.projectId);
  }

  /**
   * 获取用户可访问的GitLab实例列表
   */
  async getUserAccessibleInstances(userId: string): Promise<GitLabInstance[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return [];
      }

      // 系统管理员可以访问所有实例
      if ((user.systemRoles?.[0] || 'user') === 'admin') {
        return this.instanceRepository.find({
          where: { isActive: true },
        });
      }

      // 其他角色暂时无权限
      return [];

    } catch (error) {
      this.logger.error(`获取用户可访问实例失败: ${getErrorMessage(error)}`, {
        userId,
        error: getErrorStack(error),
      });
      return [];
    }
  }

  /**
   * 获取用户可访问的项目映射列表
   */
  async getUserAccessibleMappings(userId: string): Promise<GitLabProjectMapping[]> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return [];
      }

      // 系统管理员可以访问所有映射
      if ((user.systemRoles?.[0] || 'user') === 'admin') {
        return this.projectMappingRepository.find({
          where: { isActive: true },
          relations: ['project', 'gitlabInstance'],
        });
      }

      // 项目管理员可以访问相关项目的映射
      if ((user.systemRoles?.[0] || 'user') === 'project_manager') {
        // 这里需要根据用户的项目权限来过滤
        // 简化实现，返回空数组
        return [];
      }

      // 普通用户无权限
      return [];

    } catch (error) {
      this.logger.error(`获取用户可访问映射失败: ${getErrorMessage(error)}`, {
        userId,
        error: getErrorStack(error),
      });
      return [];
    }
  }

  /**
   * 检查用户是否可以执行同步操作
   */
  async canPerformSync(
    userId: string,
    syncType: 'incremental' | 'full' | 'compensation',
    context: {
      instanceId?: string;
      projectId?: string;
    },
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return false;
      }

      // 系统管理员可以执行所有同步操作
      if ((user.systemRoles?.[0] || 'user') === 'admin') {
        return true;
      }

      // 项目管理员可以执行项目级同步
      if ((user.systemRoles?.[0] || 'user') === 'project_manager' && context.projectId) {
        return this.checkProjectAccess(user, context.projectId!);
      }

      return false;

    } catch (error) {
      this.logger.error(`检查同步权限失败: ${getErrorMessage(error)}`, {
        userId,
        syncType,
        context,
        error: getErrorStack(error),
      });
      return false;
    }
  }

  /**
   * 获取用户权限摘要
   */
  async getUserPermissionSummary(userId: string): Promise<{
    role: string;
    permissions: string[];
    accessibleInstances: number;
    accessibleMappings: number;
    canSync: boolean;
  }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return {
          role: 'unknown',
          permissions: [],
          accessibleInstances: 0,
          accessibleMappings: 0,
          canSync: false,
        };
      }

      const rolePermissions = (RolePermissions as any)[user.systemRoles?.[0] || 'user'] || [];
      const permissions = rolePermissions.map((p: any) => `${p.action}:${p.resource}`);
      
      const accessibleInstances = await this.getUserAccessibleInstances(userId);
      const accessibleMappings = await this.getUserAccessibleMappings(userId);
      
      const canSync = (user.systemRoles?.[0] || 'user') === 'admin' || (user.systemRoles?.[0] || 'user') === 'project_manager';

      return {
        role: user.systemRoles?.[0] || 'user',
        permissions,
        accessibleInstances: accessibleInstances.length,
        accessibleMappings: accessibleMappings.length,
        canSync,
      };

    } catch (error) {
      this.logger.error(`获取用户权限摘要失败: ${getErrorMessage(error)}`, {
        userId,
        error: getErrorStack(error),
      });
      
      return {
        role: 'unknown',
        permissions: [],
        accessibleInstances: 0,
        accessibleMappings: 0,
        canSync: false,
      };
    }
  }
}
