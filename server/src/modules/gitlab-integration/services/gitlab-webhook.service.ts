import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabEventLog } from '../entities/gitlab-event-log.entity';
import {
  GitLabWebhookEvent,
  GitLabPushEvent,
  GitLabMergeRequestEvent,
  GitLabIssueEvent,
  GitLabPipelineEvent,
} from '../interfaces/gitlab-api.interface';

/**
 * GitLab Webhook服务
 * 负责处理GitLab Webhook事件
 */
@Injectable()
export class GitLabWebhookService {
  private readonly logger = new Logger(GitLabWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 验证Webhook签名
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!secret) {
      this.logger.warn('Webhook签名验证失败: 缺少密钥');
      return false;
    }

    try {
      // GitLab使用X-Gitlab-Token或X-Gitlab-Event-Token头进行验证
      // 这里我们支持HMAC-SHA256签名验证
      const expectedSignature = createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      // 使用timingSafeEqual防止时序攻击
      const providedSignature = signature.replace('sha256=', '');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const providedBuffer = Buffer.from(providedSignature, 'hex');

      if (expectedBuffer.length !== providedBuffer.length) {
        return false;
      }

      return timingSafeEqual(expectedBuffer, providedBuffer);
    } catch (error) {
      this.logger.error(`Webhook签名验证异常: ${error.message}`, {
        error: error.stack,
      });
      return false;
    }
  }

  /**
   * 验证GitLab Token
   */
  verifyGitLabToken(
    payload: string,
    token: string,
    secret: string,
  ): boolean {
    if (!secret) {
      this.logger.warn('GitLab Token验证失败: 缺少密钥');
      return false;
    }

    // GitLab使用简单的token验证
    return token === secret;
  }

  /**
   * 解析Webhook事件
   */
  parseWebhookEvent(payload: string): GitLabWebhookEvent {
    try {
      const event = JSON.parse(payload);
      
      // 验证必要字段
      if (!event.object_kind || !event.project) {
        throw new BadRequestException('无效的GitLab Webhook事件');
      }

      return event as GitLabWebhookEvent;
    } catch (error) {
      this.logger.error(`解析Webhook事件失败: ${error.message}`, {
        error: error.stack,
        payload: payload.substring(0, 500), // 只记录前500个字符
      });
      throw new BadRequestException('无效的Webhook事件格式');
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
    return event.project?.id;
  }

  /**
   * 获取项目路径
   */
  getProjectPath(event: GitLabWebhookEvent): string {
    return event.project?.path_with_namespace || '';
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
    const project = event.project?.name || event.project?.path_with_namespace || 'Unknown Project';
    const action = event.object_attributes?.action || event.action || 'unknown';
    return `${event.object_kind} - ${action} - ${project}`;
  }

  /**
   * 检查事件是否有效
   */
  isValidEvent(event: GitLabWebhookEvent): boolean {
    try {
      // 检查必要字段
      if (!event.object_kind || !event.project?.id) {
        return false;
      }

      // 检查时间字段
      if (!event.created_at) {
        return false;
      }

      // 检查项目信息
      if (!event.project.name && !event.project.path_with_namespace) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`验证事件失败: ${error.message}`, {
        error: error.stack,
        eventType: event.object_kind,
      });
      return false;
    }
  }

  /**
   * 过滤事件（根据配置）
   */
  shouldProcessEvent(
    event: GitLabWebhookEvent,
    instance: GitLabInstance,
    allowedEvents: string[] = ['push', 'merge_request', 'issue', 'pipeline'],
  ): boolean {
    const eventType = this.getEventType(event);
    
    // 检查事件类型是否在允许列表中
    if (!allowedEvents.includes(eventType)) {
      this.logger.debug(`跳过不支持的事件类型: ${eventType}`, {
        instanceId: instance.id,
        eventType,
        allowedEvents,
      });
      return false;
    }

    // 检查实例是否激活
    if (!instance.isActive) {
      this.logger.debug(`跳过非激活实例的事件: ${instance.name}`, {
        instanceId: instance.id,
        eventType,
      });
      return false;
    }

    // 检查事件是否有效
    if (!this.isValidEvent(event)) {
      this.logger.warn(`跳过无效事件`, {
        instanceId: instance.id,
        eventType,
        projectId: this.getProjectId(event),
      });
      return false;
    }

    return true;
  }

  /**
   * 创建事件日志
   */
  createEventLog(
    instance: GitLabInstance,
    event: GitLabWebhookEvent,
  ): Partial<GitLabEventLog> {
    return {
      gitlabInstanceId: instance.id,
      eventType: this.getEventType(event),
      eventData: event,
      processed: false,
      retryCount: 0,
    };
  }

  /**
   * 获取事件优先级
   */
  getEventPriority(event: GitLabWebhookEvent): number {
    const eventType = this.getEventType(event);
    
    // 根据事件类型设置优先级
    switch (eventType) {
      case 'pipeline':
        return 1; // 最高优先级
      case 'merge_request':
        return 2;
      case 'issue':
        return 3;
      case 'push':
        return 4; // 最低优先级
      default:
        return 5;
    }
  }

  /**
   * 检查事件是否过期
   */
  isEventExpired(event: GitLabWebhookEvent, maxAgeMinutes: number = 60): boolean {
    try {
      const eventTime = new Date(event.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - eventTime.getTime()) / (1000 * 60);
      
      return diffMinutes > maxAgeMinutes;
    } catch (error) {
      this.logger.error(`检查事件过期时间失败: ${error.message}`, {
        error: error.stack,
        eventType: event.object_kind,
      });
      return true; // 如果无法解析时间，认为已过期
    }
  }

  /**
   * 获取事件重试延迟（毫秒）
   */
  getRetryDelay(retryCount: number): number {
    // 指数退避：1秒, 2秒, 4秒, 8秒, 16秒...
    const baseDelay = 1000;
    const maxDelay = 300000; // 5分钟
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    
    // 添加随机抖动，避免同时重试
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }

  /**
   * 检查是否应该重试事件
   */
  shouldRetryEvent(
    eventLog: GitLabEventLog,
    maxRetries: number = 5,
    maxAgeHours: number = 24,
  ): boolean {
    // 检查重试次数
    if (eventLog.retryCount >= maxRetries) {
      return false;
    }

    // 检查事件年龄
    const ageHours = eventLog.getAgeInHours();
    if (ageHours > maxAgeHours) {
      return false;
    }

    // 检查是否已处理
    if (eventLog.processed) {
      return false;
    }

    return true;
  }
}
