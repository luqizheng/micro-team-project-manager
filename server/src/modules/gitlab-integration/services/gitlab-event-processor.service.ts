import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GitLabEventLog } from '../core/entities/gitlab-event-log.entity';
import { GitLabInstance } from '../core/entities/gitlab-instance.entity';
import { GitLabSyncService } from './gitlab-sync.service';
import { GitLabWebhookService } from './gitlab-webhook.service';
import { EventProcessResult, SyncStatus } from '../interfaces/gitlab-sync.interface';

/**
 * GitLab事件处理器服务
 * 负责事件处理、幂等性检查、重试和清理
 */
@Injectable()
export class GitLabEventProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GitLabEventProcessorService.name);
  private readonly maxConcurrentEvents = 10;
  private readonly maxRetries = 5;
  private readonly retryDelay = 1000; // 1秒
  private readonly maxEventAge = 24 * 60 * 60 * 1000; // 24Сʱ
  private readonly processingEvents = new Set<string>();
  private isShuttingDown = false;

  constructor(
    @InjectRepository(GitLabEventLog)
    private readonly eventLogRepository: Repository<GitLabEventLog>,
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    private readonly syncService: GitLabSyncService,
  ) {}

  async onModuleInit() {
    this.logger.log('GitLab事件处理器服务启动');
    // ����ʱ����δ��ɵ��¼�
    await this.processPendingEvents();
  }

  async onModuleDestroy() {
    this.logger.log('GitLab事件处理器服务关闭');
    this.isShuttingDown = true;
    
    // 等待处理中的事件完成
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

          // 检查事件是否过期 - 使用24小时为过期时间
      if (this.isEventExpired(eventLog.eventData, 24)) {
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
      
      // 记录事件日志
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
      this.logger.error(`事件处理失败: ${error.message}`, {
        eventLogId,
        error: error.stack,
      });

      // 记录事件日志为失败
      try {
        const eventLog = await this.eventLogRepository.findOne({
          where: { id: eventLogId },
        });
        if (eventLog) {
          eventLog.markAsFailed(error.message);
          await this.eventLogRepository.save(eventLog);
        }
      } catch (updateError:any) {
        this.logger.error(`事件日志更新失败: ${updateError.message}`, {
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
   * 检查事件是否过期
   */
  private isEventExpired(eventData: any, hours: number): boolean {
    try {
      const eventTime = new Date(eventData.created_at || eventData.createdAt || Date.now());
      const expirationTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      return eventTime < expirationTime;
    } catch {
      return false;
    }
  }

  /**
   * ���������¼�
   */
  private async handleEvent(eventLog: GitLabEventLog): Promise<EventProcessResult> {
    const { eventType, eventData, gitlabInstance } = eventLog;
    const event = eventData as any;

    this.logger.debug(`事件: ${eventType}`, {
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
        case 'tag_push':
          return await this.syncService.handleTagPushEvent(gitlabInstance, event);
        case 'release':
          return await this.syncService.handleReleaseEvent(gitlabInstance, event);
        case 'job':
        case 'wiki_page':
        case 'deployment':
          // 业务逻辑：处理成功，不重试
          return {
            success: true,
            message: `事件记录: ${eventType}`,
            retryable: false,
          };
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
      this.logger.error(`事件处理失败: ${error.message}`, {
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
   * 处理等待中的事件
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingEvents(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      // 获取等待中的事件
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

      this.logger.debug(`处理等待中的事件: ${pendingEvents.length} 条`);

      // ���������¼�
      const promises = pendingEvents.map(event => this.processEvent(event.id));
      await Promise.allSettled(promises);

    } catch (error:any)  {
      this.logger.error(`处理等待中的事件失败: ${error.message}`, {
        error: error.stack,
      });
    }
  }

  /**
    * 处理失败的事件
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedEvents(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      // 获取需要处理的事件
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

      this.logger.log(`处理失败的事件: ${failedEvents.length} 条`);

      // ���������¼�
      const promises = failedEvents.map(event => this.processEvent(event.id));
      await Promise.allSettled(promises);

    } catch (error:any)  {
      this.logger.error(`处理失败的事件失败: ${error.message}`, {
        error: error.stack,
      });
    }
  }

  /**
   * 清理过期的事件
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredEvents(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      const expiredDate = new Date(Date.now() - this.maxEventAge);
      
      // 删除已处理的事件
      const deletedProcessed = await this.eventLogRepository.delete({
        processed: true,
        createdAt: LessThan(expiredDate),
      });

      // 删除已失败的事件
      const deletedFailed = await this.eventLogRepository.delete({
        processed: false,
        retryCount: this.maxRetries,
        createdAt: LessThan(expiredDate),
      });

      if ((deletedProcessed!.affected??0 ) > 0 || (deletedFailed!.affected ??0) > 0) {
        this.logger.log(`���������¼����`, {
          deletedProcessed: deletedProcessed.affected,
          deletedFailed: deletedFailed.affected,
        });
      }

    } catch (error:any)  {
      this.logger.error(`���������¼�ʧ��: ${error.message}`, {
        error: error.stack,
      });
    }
  }

  /**
   * ��ȡ�¼�����ͳ��
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

      // ����ƽ������ʱ�� - �����Ѵ����¼���ʱ��
      let averageProcessingTime = 0;
      if (processedEvents > 0) {
        const processedEventLogs = await this.eventLogRepository.find({
          where: { processed: true },
          select: ['createdAt', 'processedAt'],
          take: 100, // ���Ʋ�ѯ�������������
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

      this.logger.debug("�¼�ͳ����Ϣ�������", {
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
      this.logger.error("��ȡ�¼�ͳ����Ϣʧ��", error);
      // ����Ĭ��ֵ�������׳�����
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
   * �ֶ������¼�
   */
  async retryEvent(eventLogId: string): Promise<EventProcessResult> {
    this.logger.log(`�ֶ������¼�: ${eventLogId}`);

    const eventLog = await this.eventLogRepository.findOne({
      where: { id: eventLogId },
      relations: ['gitlabInstance'],
    });

    if (!eventLog) {
      return {
        success: false,
        message: '�¼���־������',
        retryable: false,
      };
    }

    if (eventLog.processed) {
      return {
        success: true,
        message: '�¼��Ѵ���',
        retryable: false,
      };
    }

    // �������Լ���
    eventLog.resetRetryCount();
    await this.eventLogRepository.save(eventLog);

    return this.processEvent(eventLogId);
  }

  /**
   * ���������¼�
   */
  async retryEvents(eventLogIds: string[]): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: EventProcessResult[];
  }> {
    this.logger.log(`���������¼�: ${eventLogIds.length} ��`);

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
          message: '����ʧ��',
          retryable: true,
        }
      ),
    };
  }

  /**
    * ��ȡ�¼���������״̬
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
      
      // ��������
      if (stats.errorRate > 10) {
        issues.push(`�¼����������ʹ���: ${stats.errorRate.toFixed(2)}%`);
        recommendations.push('���GitLabʵ�����Ӻ�����');
      }

      // ���������¼�����
      if (stats.pendingEvents > 100) {
        issues.push(`�������¼�����: ${stats.pendingEvents}`);
        recommendations.push('�������Ӵ������������鴦������');
      }

      // ������ڴ������¼�
      if (stats.processingEvents > this.maxConcurrentEvents) {
        issues.push(`���ڴ������¼���������: ${stats.processingEvents}`);
        recommendations.push('����¼������߼��Ƿ�������');
      }

      // ���ʧ���¼�
      if (stats.failedEvents > 50) {
        issues.push(`ʧ���¼�����: ${stats.failedEvents}`);
        recommendations.push('���ʧ���¼��������ֶ�����');
      }

    } catch (error:any)  {
      issues.push(`��ȡ����״̬ʧ��: ${error.message}`);
      recommendations.push('������ݿ����Ӻ��¼�����������');
    }

    const isHealthy = issues.length === 0;
    const nextCheck = new Date(now.getTime() + 5 * 60 * 1000); // 5����

    return {
      isHealthy,
      issues,
      recommendations,
      lastCheck: now,
      nextCheck,
    };
  }

  /**
   * �ӳ�ִ��
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
