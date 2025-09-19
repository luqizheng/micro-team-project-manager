import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Headers, 
  Logger, 
  HttpException, 
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabInstance } from '../core/entities/gitlab-instance.entity';
import { GitLabEventLog } from '../core/entities/gitlab-event-log.entity';
import { GitLabWebhookService } from '../services/gitlab-webhook.service';
import { GitLabSyncService } from '../services/gitlab-sync.service';
import { GitLabIntegrationService } from '../services/gitlab-integration.service';
import { GitLabWebhookEvent } from '../interfaces/gitlab-api.interface';

/**
 * GitLab Webhook接收控制器
 * 负责接收和处理GitLab发送的Webhook事件
 */
@Controller('gitlab/webhook')
export class GitLabWebhookController {
  private readonly logger = new Logger(GitLabWebhookController.name);

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly gitlabInstanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabEventLog)
    private readonly eventLogRepository: Repository<GitLabEventLog>,
    private readonly webhookService: GitLabWebhookService,
    private readonly syncService: GitLabSyncService,
    private readonly integrationService: GitLabIntegrationService,
  ) {}

  /**
   * 接收GitLab Webhook事件
   */
  @Post(':instanceId')
  async handleWebhook(
    @Param('instanceId') instanceId: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ): Promise<void> {
    const startTime = Date.now();
    
    this.logger.log(`接收GitLab Webhook事件: ${instanceId}`, {
      instanceId,
      eventType: payload?.object_kind,
      projectId: payload?.project?.id,
      headers: this.sanitizeHeaders(headers),
    });

    try {
      // 1. 验证实例是否存在
      const instance = await this.gitlabInstanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        this.logger.warn(`GitLab实例不存在或未激活 ${instanceId}`);
        throw new Error(`GitLab实例 "${instanceId}" 不存在或未激活`);
      }

      // 2. 验证Webhook签名
      const signature = headers['x-gitlab-token'] || headers['x-gitlab-event-token'];
      const webhookSecret = instance.webhookSecret;

      if (!this.verifyWebhookSignature(payload, signature, webhookSecret || '')) {
        this.logger.warn(`Webhook签名验证失败: ${instanceId}`, {
          instanceId,
          hasSignature: !!signature,
          hasSecret: !!webhookSecret,
        });
        throw new UnauthorizedException('Webhook签名验证失败');
      }

      // 3. 解析事件
      const event = this.webhookService.parseWebhookEvent(JSON.stringify(payload));
      
      // 4. 验证事件
      if (!this.webhookService.isValidEvent(event)) {
        this.logger.warn(`无效的Webhook事件: ${instanceId}`, {
          instanceId,
          eventType: event.object_kind,
          projectId: event.project?.id,
        });
        throw new BadRequestException('无效的Webhook事件');
      }

      // 5. 检查是否应该处理此事件
      const allowedEvents = ['push', 'merge_request', 'issue', 'pipeline'];
      // if (!this.webhookService.shouldProcessEvent(event, instance, allowedEvents)) {
      if (false) {
        this.logger.debug(`跳过事件处理: ${instanceId}`, {
          instanceId,
          eventType: event.object_kind,
          projectId: event.project?.id,
        });
        res.status(HttpStatus.OK).json({ message: '事件已跳过' });
        return;
      }

      // 6. 创建事件日志
      const eventLog = this.eventLogRepository.create({
        gitlabInstanceId: instance.id,
        eventType: event.object_kind,
        eventData: event,
        processed: false,
        retryCount: 0,
      });
      const savedEventLog: GitLabEventLog = await this.eventLogRepository.save(eventLog);

      // 7. 异步处理事件
      this.processEventAsync(instance, event, savedEventLog.id).catch(error => {
        this.logger.error(`异步处理事件失败: ${error.message}`, {
          instanceId,
          eventLogId: savedEventLog.id,
          error: error.stack,
        });
      });

      // 8. 立即返回响应
      const processingTime = Date.now() - startTime;
      this.logger.log(`Webhook事件接收成功: ${instanceId}`, {
        instanceId,
        eventLogId: savedEventLog.id,
        eventType: event.object_kind,
        processingTime,
      });

      res.status(HttpStatus.OK).json({
        message: 'Webhook事件接收成功',
        eventId: savedEventLog.id,
        eventType: event.object_kind,
        processingTime,
      });

    } catch (error:any) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Webhook事件处理失败: ${error.message}`, {
        instanceId,
        error: error.stack,
        processingTime,
      });

      // 根据错误类型返回不同的状态码
      if (error instanceof Error && error.message.includes('不存在')) {
        res.status(HttpStatus.NOT_FOUND).json({
          error: 'GitLab实例不存在',
          message: error.message,
        });
      } else if (error instanceof UnauthorizedException) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: 'Webhook签名验证失败',
          message: error.message,
        });
      } else if (error instanceof BadRequestException) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: '无效的Webhook事件',
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: '内部服务器错误',
          message: 'Webhook事件处理失败',
        });
      }
    }
  }

  /**
   * 异步处理事件
   */
  private async processEventAsync(
    instance: GitLabInstance,
    event: GitLabWebhookEvent,
    eventLogId: string,
  ): Promise<void> {
    try {
      this.logger.debug(`开始异步处理事件 ${eventLogId}`, {
        instanceId: instance.id,
        eventType: event.object_kind,
        projectId: event.project?.id,
      });

      // 根据事件类型处理
      let result;
      if (this.webhookService.isPushEvent(event)) {
        result = await this.syncService.handlePushEvent(instance, event);
      } else if (this.webhookService.isMergeRequestEvent(event)) {
        result = await this.syncService.handleMergeRequestEvent(instance, event);
      } else if (this.webhookService.isIssueEvent(event)) {
        result = await this.syncService.handleIssueEvent(instance, event);
      } else if (this.webhookService.isPipelineEvent(event)) {
        result = await this.syncService.handlePipelineEvent(instance, event);
      } else {
        this.logger.warn(`不支持的事件类型: ${event.object_kind}`, {
          instanceId: instance.id,
          eventLogId,
        });
        return;
      }

      // 更新事件日志
      await this.updateEventLog(eventLogId, result);

      this.logger.log(`事件处理完成: ${eventLogId}`, {
        instanceId: instance.id,
        eventLogId,
        success: result.success,
        message: result.message,
      });

    } catch (error:any) {
      this.logger.error(`异步处理事件异常: ${error.message}`, {
        instanceId: instance.id,
        eventLogId,
        error: error.stack,
      });

      // 更新事件日志为失�?
      await this.updateEventLog(eventLogId, {
        success: false,
        message: error.message,
        retryable: true,
      });
    }
  }

  /**
   * 更新事件日志
   */
  private async updateEventLog(
    eventLogId: string,
    result: { success: boolean; message: string; retryable?: boolean },
  ): Promise<void> {
    try {
      const eventLog = await this.eventLogRepository.findOne({
        where: { id: eventLogId },
      });

      if (eventLog) {
        if (result.success) {
          eventLog.markAsProcessed();
        } else {
          eventLog.markAsFailed(result.message);
        }
        await this.eventLogRepository.save(eventLog);
      }
    } catch (error:any) {
      this.logger.error(`更新事件日志失败: ${error.message}`, {
        eventLogId,
        error: error.stack,
      });
    }
  }

  /**
   * 验证Webhook签名
   */
  private verifyWebhookSignature(
    payload: any,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature || !secret) {
      return false;
    }

    try {
      // 支持两种验证方式
      if (signature.startsWith('sha256=')) {
        // HMAC-SHA256签名验证
        return this.webhookService.verifyWebhookSignature(
          JSON.stringify(payload),
          signature,
          secret,
        );
      } else {
        // GitLab Token验证
        return this.webhookService.verifyWebhookSignature(
          JSON.stringify(payload),
          signature,
          secret,
        );
      }
    } catch (error:any) {
      this.logger.error(`Webhook签名验证异常: ${error.message}`, {
        error: error.stack,
        hasSignature: !!signature,
        hasSecret: !!secret,
      });
      return false;
    }
  }

  /**
   * 清理敏感头部信息
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    // 移除敏感信息
    delete sanitized['authorization'];
    delete sanitized['x-gitlab-token'];
    delete sanitized['x-gitlab-event-token'];
    
    // 截断过长的字符串
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] && sanitized[key].length > 100) {
        sanitized[key] = sanitized[key].substring(0, 100) + '...';
      }
    });

    return sanitized;
  }

  /**
   * 健康检查端点
   */
  @Post('health')
  async healthCheck(@Res() res: Response): Promise<void> {
    try {
      const stats = await this.integrationService.getSyncStatistics();
      
      res.status(HttpStatus.OK).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
          totalMappings: stats.totalMappings,
          activeMappings: stats.activeMappings,
          failedSyncs: stats.failedSyncs,
          errorRate: stats.errorRate,
        },
      });
    } catch (error:any) {
      this.logger.error(`健康检查失败: ${error.message}`, {
        error: error.stack,
      });

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  /**
   * 获取事件日志
   */
  @Post('events/:instanceId')
  async getEventLogs(
    @Param('instanceId') instanceId: string,
    @Body() query: { page?: number; limit?: number; eventType?: string },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100);
      const offset = (page - 1) * limit;

      const [events, total] = await this.eventLogRepository.findAndCount({
        where: {
          gitlabInstanceId: instanceId,
          ...(query.eventType && { eventType: query.eventType }),
        },
        order: { createdAt: 'DESC' },
        skip: offset,
        take: limit,
      });

      res.status(HttpStatus.OK).json({
        events: events.map(event => ({
          id: event.id,
          eventType: event.eventType,
          processed: event.processed,
          errorMessage: event.errorMessage,
          retryCount: event.retryCount,
          createdAt: event.createdAt,
          processedAt: event.processedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error:any) {
      this.logger.error(`获取事件日志失败: ${error.message}`, {
        instanceId,
        error: error.stack,
      });

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: '获取事件日志失败',
        message: error.message,
      });
    }
  }
}
