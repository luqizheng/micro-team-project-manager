import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import {
  GitLabWebhookEvent,
  GitLabPushEvent,
  GitLabMergeRequestEvent,
  GitLabIssueEvent,
  GitLabPipelineEvent,
} from '../interfaces/gitlab-api.interface';

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
 * GitLab Webhook服务
 * 负责处理GitLab Webhook事件的接收、验证和解析
 */
@Injectable()
export class GitLabWebhookService {
  private readonly logger = new Logger(GitLabWebhookService.name);

  /**
   * 验证Webhook签名
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      return expectedSignature === providedSignature;
    } catch (error) {
      this.logger.error(`Webhook签名验证异常: ${getErrorMessage(error)}`, {
        error: getErrorStack(error),
      });
      return false;
    }
  }

  /**
   * 解析Webhook事件
   */
  parseWebhookEvent(payload: string): GitLabWebhookEvent {
    try {
      const event = JSON.parse(payload);
      
      // 验证必要字段
      if (!event.object_kind || !event.project) {
        throw new BadRequestException('无效的Webhook事件格式');
      }

      return event as GitLabWebhookEvent;
    } catch (error) {
      this.logger.error(`解析Webhook事件失败: ${getErrorMessage(error)}`, {
        error: getErrorStack(error),
      });
      throw new BadRequestException('无法解析Webhook事件');
    }
  }

  /**
   * 获取事件类型
   */
  getEventType(event: GitLabWebhookEvent): string {
    return event.object_kind;
  }

  /**
   * 检查是否为Push事件
   */
  isPushEvent(event: GitLabWebhookEvent): event is GitLabPushEvent {
    return event.object_kind === 'push';
  }

  /**
   * 检查是否为Merge Request事件
   */
  isMergeRequestEvent(event: GitLabWebhookEvent): event is GitLabMergeRequestEvent {
    return event.object_kind === 'merge_request';
  }

  /**
   * 检查是否为Issue事件
   */
  isIssueEvent(event: GitLabWebhookEvent): event is GitLabIssueEvent {
    return event.object_kind === 'issue';
  }

  /**
   * 检查是否为Pipeline事件
   */
  isPipelineEvent(event: GitLabWebhookEvent): event is GitLabPipelineEvent {
    return event.object_kind === 'pipeline';
  }

  /**
   * 获取项目ID
   */
  getProjectId(event: GitLabWebhookEvent): number {
    return event.project.id;
  }

  /**
   * 获取项目路径
   */
  getProjectPath(event: GitLabWebhookEvent): string {
    return event.project.path_with_namespace;
  }

  /**
   * 获取用户信息
   */
  getUser(event: GitLabWebhookEvent) {
    return event.user;
  }

  /**
   * 获取事件摘要
   */
  getEventSummary(event: GitLabWebhookEvent): string {
    const action = event.object_attributes?.action || event.action || 'unknown';
    return `${event.object_kind} ${action} in ${event.project.name}`;
  }

  /**
   * 验证事件有效性
   */
  isValidEvent(event: GitLabWebhookEvent): boolean {
    try {
      // 检查必要字段
      if (!event.object_kind || !event.project || !event.user) {
        return false;
      }

      // 检查项目信息
      if (!event.project.id || !event.project.name) {
        return false;
      }

      // 检查用户信息
      if (!event.user.id || !event.user.username) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`验证事件失败: ${getErrorMessage(error)}`, {
        error: getErrorStack(error),
      });
      return false;
    }
  }

  /**
   * 处理Webhook事件
   */
  async processWebhookEvent(
    instance: GitLabInstance,
    event: GitLabWebhookEvent,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`处理Webhook事件: ${this.getEventSummary(event)}`);

      // 验证事件
      if (!this.isValidEvent(event)) {
        throw new BadRequestException('无效的Webhook事件');
      }

      // 根据事件类型处理
      const eventType = this.getEventType(event);
      this.logger.log(`事件类型: ${eventType}`);

      return {
        success: true,
        message: `Webhook事件处理成功: ${eventType}`,
      };
    } catch (error) {
      this.logger.error(`处理Webhook事件失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        eventType: event.object_kind,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  /**
   * 验证事件过期时间
   */
  isEventExpired(event: GitLabWebhookEvent, maxAgeMinutes: number = 60): boolean {
    try {
      const eventTime = new Date(event.created_at);
      const now = new Date();
      const ageMinutes = (now.getTime() - eventTime.getTime()) / (1000 * 60);
      
      return ageMinutes > maxAgeMinutes;
    } catch (error) {
      this.logger.error(`检查事件过期时间失败: ${getErrorMessage(error)}`, {
        error: getErrorStack(error),
      });
      return true; // 如果无法确定时间，认为已过期
    }
  }

  /**
   * 获取事件优先级
   */
  getEventPriority(event: GitLabWebhookEvent): number {
    const priorityMap: { [key: string]: number } = {
      'push': 1,
      'merge_request': 2,
      'issue': 3,
      'pipeline': 4,
      'note': 5,
      'wiki_page': 6,
      'deployment': 7,
    };

    return priorityMap[event.object_kind] || 10;
  }

  /**
   * 获取事件处理超时时间（毫秒）
   */
  getEventTimeout(event: GitLabWebhookEvent): number {
    const timeoutMap: { [key: string]: number } = {
      'push': 30000,        // 30秒
      'merge_request': 60000, // 1分钟
      'issue': 45000,       // 45秒
      'pipeline': 120000,   // 2分钟
      'note': 30000,        // 30秒
      'wiki_page': 30000,   // 30秒
      'deployment': 90000,  // 1.5分钟
    };

    return timeoutMap[event.object_kind] || 60000; // 默认1分钟
  }

  /**
   * 检查事件是否需要重试
   */
  shouldRetryEvent(event: GitLabWebhookEvent, retryCount: number): boolean {
    const maxRetries = 3;
    
    // 检查重试次数
    if (retryCount >= maxRetries) {
      return false;
    }

    // 检查事件类型
    const retryableEvents = ['push', 'merge_request', 'issue', 'pipeline'];
    if (!retryableEvents.includes(event.object_kind)) {
      return false;
    }

    // 检查事件是否过期
    if (this.isEventExpired(event)) {
      return false;
    }

    return true;
  }

  /**
   * 获取事件重试延迟（毫秒）
   */
  getRetryDelay(retryCount: number): number {
    // 指数退避：1秒、2秒、4秒
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  }

  /**
   * 清理事件数据
   */
  sanitizeEventData(event: GitLabWebhookEvent): GitLabWebhookEvent {
    // 移除敏感信息
    const sanitized = { ...event };
    
    // 清理用户密码等敏感信息
    if (sanitized.user) {
      delete (sanitized.user as any).password;
      delete (sanitized.user as any).password_hash;
    }

    // 清理项目敏感信息
    if (sanitized.project) {
      delete (sanitized.project as any).token;
      delete (sanitized.project as any).access_token;
    }

    return sanitized;
  }
}