import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { GitLabPermissionsService } from '../services/gitlab-permissions.service';

/**
 * GitLab集成权限中间件
 * 用于在请求处理前验证用户权限
 */
@Injectable()
export class GitLabPermissionsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GitLabPermissionsMiddleware.name);

  constructor(
    private readonly permissionsService: GitLabPermissionsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 获取用户信息
      const user = (req as any).user;
      if (!user) {
        this.logger.warn('未认证用户尝试访问GitLab集成功能', {
          path: req.path,
          method: req.method,
        });
        res.status(401).json({
          error: '未认证',
          message: '请先登录',
        });
        return;
      }

      // 解析权限要求
      const permission = this.extractPermission(req);
      if (!permission) {
        // 没有权限要求，直接通过
        next();
        return;
      }

      // 提取上下文信息
      const context = this.extractContext(req);

      // 检查权限
      const hasPermission = await this.permissionsService.checkPermission(
        user.id,
        permission,
        context,
      );

      if (!hasPermission) {
        this.logger.warn(`用户 ${user.id} 权限不足`, {
          userId: user.id,
          userRole: user.role,
          permission,
          context,
          path: req.path,
          method: req.method,
        });
        
        res.status(403).json({
          error: '权限不足',
          message: '您没有权限执行此操作',
        });
        return;
      }

      // 权限验证通过，继续处理请求
      next();

    } catch (error) {
      this.logger.error(`权限验证中间件异常: ${error.message}`, {
        path: req.path,
        method: req.method,
        error: error.stack,
      });
      
      res.status(500).json({
        error: '内部服务器错误',
        message: '权限验证失败',
      });
    }
  }

  /**
   * 从请求中提取权限要求
   */
  private extractPermission(req: Request): string | null {
    const { method, path } = req;

    // 根据路径和方法确定权限要求
    if (path.startsWith('/gitlab/instances')) {
      if (method === 'GET') {
        return 'read:gitlab_instance';
      } else if (method === 'POST') {
        return 'create:gitlab_instance';
      } else if (method === 'PUT') {
        return 'update:gitlab_instance';
      } else if (method === 'DELETE') {
        return 'delete:gitlab_instance';
      }
    }

    if (path.startsWith('/gitlab/projects') && path.includes('/mappings')) {
      if (method === 'GET') {
        return 'read:gitlab_project_mapping';
      } else if (method === 'POST') {
        return 'create:gitlab_project_mapping';
      } else if (method === 'PUT') {
        return 'update:gitlab_project_mapping';
      } else if (method === 'DELETE') {
        return 'delete:gitlab_project_mapping';
      }
    }

    if (path.startsWith('/gitlab/sync')) {
      if (path.includes('/incremental')) {
        return 'sync:gitlab_sync';
      } else if (path.includes('/full')) {
        return 'sync:gitlab_sync';
      } else if (path.includes('/compensation')) {
        return 'sync:gitlab_sync';
      } else if (path.includes('/users')) {
        return 'sync:gitlab_user';
      } else if (path.includes('/events')) {
        if (method === 'GET') {
          return 'read:gitlab_event';
        } else if (method === 'POST') {
          return 'retry:gitlab_event';
        }
      }
    }

    if (path.startsWith('/gitlab/statistics')) {
      return 'read:gitlab_statistics';
    }

    if (path.startsWith('/gitlab/webhook')) {
      if (method === 'POST') {
        return 'receive:gitlab_webhook';
      } else if (method === 'GET') {
        return 'read:gitlab_webhook';
      }
    }

    return null;
  }

  /**
   * 从请求中提取上下文信息
   */
  private extractContext(req: Request): {
    instanceId?: string;
    projectId?: string;
    mappingId?: string;
  } {
    const context: any = {};

    // 从路径参数中提取
    if (req.params?.instanceId) {
      context.instanceId = req.params.instanceId;
    }
    if (req.params?.id && req.path.includes('/instances/')) {
      context.instanceId = req.params.id;
    }
    if (req.params?.projectId) {
      context.projectId = req.params.projectId;
    }
    if (req.params?.mappingId) {
      context.mappingId = req.params.mappingId;
    }

    // 从查询参数中提取
    if (req.query?.instanceId) {
      context.instanceId = req.query.instanceId as string;
    }
    if (req.query?.projectId) {
      context.projectId = req.query.projectId as string;
    }

    // 从请求体中提取
    if (req.body?.instanceId) {
      context.instanceId = req.body.instanceId;
    }
    if (req.body?.projectId) {
      context.projectId = req.body.projectId;
    }

    return context;
  }
}
