import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
import { GitLabIntegrationService } from '../services/gitlab-integration.service';

/**
 * GitLab集成权限守卫
 * 负责检查用户对GitLab集成功能的访问权�?
 */
@Injectable()
export class GitLabPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(GitLabPermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly integrationService: GitLabIntegrationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('未认证用户尝试访问GitLab集成功能');
      return false;
    }

    // 获取所需的角�?
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true; // 没有角色要求，允许访�?
    }

    // 检查用户角�?
    if (!this.hasRequiredRole(user.role, requiredRoles)) {
      this.logger.warn(`用户 ${user.id} 角色 ${user.role} 不足以访问GitLab集成功能`, {
        userId: user.id,
        userRole: user.role,
        requiredRoles,
      });
      throw new ForbiddenException('权限不足，无法访问GitLab集成功能');
    }

    // 检查项目级权限
    const projectId = this.extractProjectId(request);
    if (projectId && !this.hasProjectAccess(user, projectId)) {
      this.logger.warn(`用户 ${user.id} 无权限访问项�?${projectId}`, {
        userId: user.id,
        projectId,
      });
      throw new ForbiddenException('权限不足，无法访问该项目');
    }

    // 检查实例级权限
    const instanceId = this.extractInstanceId(request);
    if (instanceId && !this.hasInstanceAccess(user, instanceId)) {
      this.logger.warn(`用户 ${user.id} 无权限访问GitLab实例 ${instanceId}`, {
        userId: user.id,
        instanceId,
      });
      throw new ForbiddenException('权限不足，无法访问该GitLab实例');
    }

    return true;
  }

  /**
   * 检查用户是否具有所需角色
   */
  private hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
    // 系统管理员拥有所有权�?
    if (userRole === 'admin') {
      return true;
    }

    // 检查是否具有所需角色之一
    return requiredRoles.includes(userRole);
  }

  /**
   * 检查用户是否有项目访问权限
   */
  private hasProjectAccess(user: any, projectId: string): boolean {
    // 系统管理员拥有所有项目权�?
    if (user.role === 'admin') {
      return true;
    }

    // 项目管理员拥有项目权�?
    if (user.role === 'project_manager') {
      // 这里需要检查用户是否是项目的管理员
      // 简化实现，假设项目管理员有权限
      return true;
    }

    // 普通用户无权限
    return false;
  }

  /**
   * 检查用户是否有GitLab实例访问权限
   */
  private hasInstanceAccess(user: any, instanceId: string): boolean {
    // 系统管理员拥有所有实例权�?
    if (user.role === 'admin') {
      return true;
    }

    // 其他角色需要检查具体的实例权限
    // 这里可以扩展更细粒度的权限控�?
    return false;
  }

  /**
   * 从请求中提取项目ID
   */
  private extractProjectId(request: any): string | null {
    // 从路径参数中提取
    if (request.params?.projectId) {
      return request.params.projectId;
    }

    // 从查询参数中提取
    if (request.query?.projectId) {
      return request.query.projectId;
    }

    // 从请求体中提�?
    if (request.body?.projectId) {
      return request.body.projectId;
    }

    return null;
  }

  /**
   * 从请求中提取实例ID
   */
  private extractInstanceId(request: any): string | null {
    // 从路径参数中提取
    if (request.params?.instanceId) {
      return request.params.instanceId;
    }

    if (request.params?.id) {
      return request.params.id;
    }

    // 从查询参数中提取
    if (request.query?.instanceId) {
      return request.query.instanceId;
    }

    // 从请求体中提�?
    if (request.body?.instanceId) {
      return request.body.instanceId;
    }

    return null;
  }
}
