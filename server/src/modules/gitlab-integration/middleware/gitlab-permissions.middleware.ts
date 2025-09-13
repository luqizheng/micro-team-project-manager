import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
import { GitLabPermissionsService } from '../services/gitlab-permissions.service';

/**
 * GitLab权限验证中间件
 */
@Injectable()
export class GitLabPermissionsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GitLabPermissionsMiddleware.name);

  constructor(
    private readonly permissionsService: GitLabPermissionsService,
  ) {}

  async use(req: any, res: any, next: any) {
    try {
      // 获取用户信息（从JWT token中解析）
      const user = (req as any).user;
      if (!user) {
        this.logger.warn('权限验证失败: 未找到用户信息', {
          path: (req as any).path,
          method: (req as any).method,
        });
        (res as any).status(401).json({
          success: false,
          message: '未授权访问',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // 获取权限上下文
      const context = this.extractPermissionContext(req);
      
      // 检查权限
      const hasPermission = await this.permissionsService.checkPermission(
        user.id,
        context.action,
        context,
      );

      if (!hasPermission) {
        this.logger.warn('权限验证失败: 权限不足', {
          userId: user.id,
          path: (req as any).path,
          method: (req as any).method,
          context,
        });
        (res as any).status(403).json({
          success: false,
          message: '权限不足',
          code: 'FORBIDDEN',
        });
        return;
      }

      // 权限验证通过，继续处理
      next();
    } catch (error) {
      this.logger.error(`权限验证中间件异常: ${(error as any).message}`, {
        path: (req as any).path,
        method: (req as any).method,
        error: (error as any).stack,
      });
      (res as any).status(500).json({
        success: false,
        message: '权限验证服务异常',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * 从请求中提取权限上下文
   */
  private extractPermissionContext(req: any): {
    action: string;
    resource: string;
    instanceId?: string;
    projectId?: string;
    mappingId?: string;
  } {
    const { method, path } = req;
    
    // 根据HTTP方法和路径确定权限
    let action = '';
    let resource = '';

    if (method === 'GET') {
      action = 'read';
    } else if (method === 'POST') {
      action = 'create';
    } else if (method === 'PUT' || method === 'PATCH') {
      action = 'update';
    } else if (method === 'DELETE') {
      action = 'delete';
    }

    if (path.includes('/instances')) {
      resource = 'gitlab:instance';
    } else if (path.includes('/mappings')) {
      resource = 'gitlab:mapping';
    } else if (path.includes('/sync')) {
      resource = 'gitlab:sync';
    } else if (path.includes('/events')) {
      resource = 'gitlab:event';
    } else if (path.includes('/permissions')) {
      resource = 'gitlab:permission';
    }

    // 提取资源ID
    const context: any = { action, resource };

    // 从路径参数中提取ID
    if ((req as any).params?.instanceId) {
      context.instanceId = (req as any).params.instanceId;
    }
    if ((req as any).params?.id && (req as any).path.includes('/instances/')) {
      context.instanceId = (req as any).params.id;
    }
    if ((req as any).params?.projectId) {
      context.projectId = (req as any).params.projectId;
    }
    if ((req as any).params?.mappingId) {
      context.mappingId = (req as any).params.mappingId;
    }

    // 从查询参数中提取ID
    if ((req as any).query?.instanceId) {
      context.instanceId = (req as any).query.instanceId as string;
    }
    if ((req as any).query?.projectId) {
      context.projectId = (req as any).query.projectId as string;
    }

    // 从请求体中提取ID
    if ((req as any).body?.instanceId) {
      context.instanceId = (req as any).body.instanceId;
    }
    if ((req as any).body?.projectId) {
      context.projectId = (req as any).body.projectId;
    }

    return context;
  }
}