import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GitLabEventLog } from '../entities/gitlab-event-log.entity';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabSyncService } from './gitlab-sync.service';
import { GitLabWebhookService } from './gitlab-webhook.service';
import { EventProcessResult, SyncStatus } from '../interfaces/gitlab-sync.interface';

/**
 * GitLab事件处理器服务
 * 负责处理事件队列、重试机制、去重和幂等性
 */
@Injectable()
export class GitLabEventProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GitLabEventProcessorService.name);
  private readonly maxConcurrentEvents = 10;
  private readonly maxRetries = 5;
  private readonly retryDelay = 1000; // 1秒
  private readonly maxEventAge = 24 * 60 * 60 * 1000; // 24小时
  private readonly processingEvents = new Set<string>();
  private isShuttingDown = false;

  constructor(
    @InjectRepository(GitLabEventLog)
    private readonly eventLogRepository: Repository<GitLabEventLog>,
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    private readonly syncService: GitLabSyncService,
    private readonly webhookService: GitLabWebhookService,
  ) {}

  async onModuleInit() {
    this.logger.log('GitLab事件处理器服务启动');
    // 启动时处理未完成的事件
    await this.processPendingEvents();
  }

  async onModuleDestroy() {
    this.logger.log('GitLab事件处理器服务关闭');
    this.isShuttingDown = true;
    
    // 等待正在处理的事件完成
    while (this.processingEvents.size > 0 && !this.isShuttingDown) {
      await this.delay(100);
    }
  }

  /**
   * 处理事件
   */
  async processEvent(eventLogId: string): Promise<EventProcessResult> {
    if (this.processingEvents.has(eventLogId)) {
      return {
        success: false,
        message: '事件正在处理中',
        retryable: true,
      };
    }

    if (this.isShuttingDown) {
      return {
        success: false,
        message: '服务正在关闭',
        retryable: true,
      };
    }

    this.processingEvents.add(eventLogId);

    try {
      const eventLog = await this.eventLogRepository.findOne({
        where: { id: eventLogId },
        relations: ['gitlabInstance'],
      });

      if (!eventLog) {
        return {
          success: false,
          message: '事件日志不存在',
          retryable: false,
        };
      }

      if (eventLog.processed) {
        return {
          success: true,
          message: '事件已处理',
          retryable: false,
        };
      }

      // 检查事件是否过期
      if (this.webhookService.isEventExpired(eventLog.eventData, 24)) {
        eventLog.markAsFailed('事件已过期');
        await this.eventLogRepository.save(eventLog);
        return {
          success: false,
          message: '事件已过期',
          retryable: false,
        };
      }

      // 处理事件
      const result = await this.handleEvent(eventLog);
      
      // 更新事件日志
      if (result.success) {
        eventLog.markAsProcessed();
      } else {
        eventLog.markAsFailed(result.message);
      }
      await this.eventLogRepository.save(eventLog);

      this.logger.log(`事件处理完成: ${eventLogId}`, {
        eventLogId,
        success: result.success,
        message: result.message,
      });

      return result;

    } catch (error:any)  {
      this.logger.error(`处理事件异常: ${error.message}`, {
        eventLogId,
        error: error.stack,
      });

      // 更新事件日志为失败
      try {
        const eventLog = await this.eventLogRepository.findOne({
          where: { id: eventLogId },
        });
        if (eventLog) {
          eventLog.markAsFailed(error.message);
          await this.eventLogRepository.save(eventLog);
        }
      } catch (updateError:any) {
        this.logger.error(`更新事件日志失败: ${updateError.message}`, {
          eventLogId,
          error: updateError.stack,
        });
      }

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    } finally {
      this.processingEvents.delete(eventLogId);
    }
  }

  /**
   * 处理具体事件
   */
  private async handleEvent(eventLog: GitLabEventLog): Promise<EventProcessResult> {
    const { eventType, eventData, gitlabInstance } = eventLog;
    const event = eventData as any;

    this.logger.debug(`处理事件: ${eventType}`, {
      eventLogId: eventLog.id,
      instanceId: gitlabInstance.id,
      projectId: event.project?.id,
    });

    try {
      switch (eventType) {
        case 'push':
          return await this.syncService.handlePushEvent(gitlabInstance, event);
        case 'merge_request':
          return await this.syncService.handleMergeRequestEvent(gitlabInstance, event);
        case 'issue':
          return await this.syncService.handleIssueEvent(gitlabInstance, event);
        case 'pipeline':
          return await this.syncService.handlePipelineEvent(gitlabInstance, event);
        default:
          this.logger.warn(`不支持的事件类型: ${eventType}`, {
            eventLogId: eventLog.id,
            eventType,
          });
          return {
            success: false,
            message: `不支持的事件类型: ${eventType}`,
            retryable: false,
          };
      }
    } catch (error:any)  {
      this.logger.error(`处理事件失败: ${error.message}`, {
        eventLogId: eventLog.id,
        eventType,
        error: error.stack,
      });
      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 处理待处理的事件（定时任务）
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingEvents(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      // 获取待处理的事件
      const pendingEvents = await this.eventLogRepository.find({
        where: {
          processed: false,
          retryCount: LessThan(this.maxRetries),
        },
        relations: ['gitlabInstance'],
        order: { createdAt: 'ASC' },
        take: this.maxConcurrentEvents - this.processingEvents.size,
      });

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.debug(`发现 ${pendingEvents.length} 个待处理事件`);

      // 并发处理事件
      const promises = pendingEvents.map(event => this.processEvent(event.id));
      await Promise.allSettled(promises);

    } catch (error:any)  {
      this.logger.error(`处理待处理事件失败: ${error.message}`, {
        error: error.stack,
      });
    }
  }

  /**
   * 重试失败的事件（定时任务）
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedEvents(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      // 获取需要重试的事件
      const failedEvents = await this.eventLogRepository.find({
        where: {
          processed: false,
          retryCount: LessThan(this.maxRetries),
          createdAt: LessThan(new Date(Date.now() - this.retryDelay)),
        },
        relations: ['gitlabInstance'],
        order: { createdAt: 'ASC' },
        take: this.maxConcurrentEvents,
      });

      if (failedEvents.length === 0) {
        return;
      }

      this.logger.log(`重试 ${failedEvents.length} 个失败事件`);

      // 并发重试事件
      const promises = failedEvents.map(event => this.processEvent(event.id));
      await Promise.allSettled(promises);

    } catch (error:any)  {
      this.logger.error(`重试失败事件失败: ${error.message}`, {
        error: error.stack,
      });
    }
  }

  /**
   * 清理过期事件（定时任务）
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredEvents(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      const expiredDate = new Date(Date.now() - this.maxEventAge);
      
      // 删除过期的已处理事件
      const deletedProcessed = await this.eventLogRepository.delete({
        processed: true,
        createdAt: LessThan(expiredDate),
      });

      // 删除过期的失败事件（重试次数超过限制）
      const deletedFailed = await this.eventLogRepository.delete({
        processed: false,
        retryCount: this.maxRetries,
        createdAt: LessThan(expiredDate),
      });

      if ((deletedProcessed!.affected??0 ) > 0 || (deletedFailed!.affected ??0) > 0) {
        this.logger.log(`清理过期事件完成`, {
          deletedProcessed: deletedProcessed.affected,
          deletedFailed: deletedFailed.affected,
        });
      }

    } catch (error:any)  {
      this.logger.error(`清理过期事件失败: ${error.message}`, {
        error: error.stack,
      });
    }
  }

  /**
   * 获取事件处理统计
   */
  async getEventStatistics(): Promise<{
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    pendingEvents: number;
    processingEvents: number;
    averageProcessingTime: number;
    errorRate: number;
  }> {
    try {
      const [totalEvents, processedEvents, failedEvents, pendingEvents] = await Promise.all([
        this.eventLogRepository.count(),
        this.eventLogRepository.count({ where: { processed: true } }),
        this.eventLogRepository.count({ 
          where: { 
            processed: false, 
            retryCount: this.maxRetries 
          } 
        }),
        this.eventLogRepository.count({ 
          where: { 
            processed: false, 
            retryCount: LessThan(this.maxRetries) 
          } 
        }),
      ]);

      const processingEvents = this.processingEvents.size;
      const errorRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

      // 计算平均处理时间 - 基于已处理事件的时间差
      let averageProcessingTime = 0;
      if (processedEvents > 0) {
        const processedEventLogs = await this.eventLogRepository.find({
          where: { processed: true },
          select: ['createdAt', 'processedAt'],
          take: 100, // 限制查询数量以提高性能
        });

        if (processedEventLogs.length > 0) {
          const totalProcessingTime = processedEventLogs
            .filter(log => log.processedAt)
            .reduce((sum, log) => {
              const processingTime = log.processedAt!.getTime() - log.createdAt.getTime();
              return sum + processingTime;
            }, 0);
          
          const validLogs = processedEventLogs.filter(log => log.processedAt).length;
          averageProcessingTime = validLogs > 0 ? totalProcessingTime / validLogs : 0;
        }
      }

      this.logger.debug("事件统计信息计算完成", {
        totalEvents,
        processedEvents,
        failedEvents,
        pendingEvents,
        processingEvents,
        averageProcessingTime,
        errorRate,
      });

      return {
        totalEvents,
        processedEvents,
        failedEvents,
        pendingEvents,
        processingEvents,
        averageProcessingTime,
        errorRate,
      };
    } catch (error) {
      this.logger.error("获取事件统计信息失败", error);
      // 返回默认值而不是抛出错误
      return {
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0,
        pendingEvents: 0,
        processingEvents: 0,
        averageProcessingTime: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * 手动重试事件
   */
  async retryEvent(eventLogId: string): Promise<EventProcessResult> {
    this.logger.log(`手动重试事件: ${eventLogId}`);

    const eventLog = await this.eventLogRepository.findOne({
      where: { id: eventLogId },
      relations: ['gitlabInstance'],
    });

    if (!eventLog) {
      return {
        success: false,
        message: '事件日志不存在',
        retryable: false,
      };
    }

    if (eventLog.processed) {
      return {
        success: true,
        message: '事件已处理',
        retryable: false,
      };
    }

    // 重置重试计数
    eventLog.resetRetryCount();
    await this.eventLogRepository.save(eventLog);

    return this.processEvent(eventLogId);
  }

  /**
   * 批量重试事件
   */
  async retryEvents(eventLogIds: string[]): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: EventProcessResult[];
  }> {
    this.logger.log(`批量重试事件: ${eventLogIds.length} 个`);

    const results = await Promise.allSettled(
      eventLogIds.map(id => this.retryEvent(id))
    );

    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;

    const failed = results.length - successful;

    return {
      total: eventLogIds.length,
      successful,
      failed,
      results: results.map(r => 
        r.status === 'fulfilled' ? r.value : {
          success: false,
          message: '处理失败',
          retryable: true,
        }
      ),
    };
  }

  /**
   * 获取事件处理健康状态
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
    lastCheck: Date;
    nextCheck: Date;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const now = new Date();

    try {
      const stats = await this.getEventStatistics();
      
      // 检查错误率
      if (stats.errorRate > 10) {
        issues.push(`事件处理错误率过高: ${stats.errorRate.toFixed(2)}%`);
        recommendations.push('检查GitLab实例连接和配置');
      }

      // 检查待处理事件数量
      if (stats.pendingEvents > 100) {
        issues.push(`待处理事件过多: ${stats.pendingEvents}`);
        recommendations.push('考虑增加处理并发数或检查处理性能');
      }

      // 检查正在处理的事件
      if (stats.processingEvents > this.maxConcurrentEvents) {
        issues.push(`正在处理的事件超过限制: ${stats.processingEvents}`);
        recommendations.push('检查事件处理逻辑是否有阻塞');
      }

      // 检查失败事件
      if (stats.failedEvents > 50) {
        issues.push(`失败事件过多: ${stats.failedEvents}`);
        recommendations.push('检查失败事件并考虑手动重试');
      }

    } catch (error:any)  {
      issues.push(`获取健康状态失败: ${error.message}`);
      recommendations.push('检查数据库连接和事件处理器服务');
    }

    const isHealthy = issues.length === 0;
    const nextCheck = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟后

    return {
      isHealthy,
      issues,
      recommendations,
      lastCheck: now,
      nextCheck,
    };
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
