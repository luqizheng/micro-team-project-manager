import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GitLabEventLog } from '../core/entities/gitlab-event-log.entity';
import { GitLabInstance } from '../core/entities/gitlab-instance.entity';
import { EventProcessResult } from '../interfaces/gitlab-sync.interface';

/**
 * GitLab事件队列服务
 * 负责事件队列管理、优先级处理、去重和幂等�?
 */
@Injectable()
export class GitLabEventQueueService {
  private readonly logger = new Logger(GitLabEventQueueService.name);
  private readonly eventQueue = new Map<string, GitLabEventLog>();
  private readonly processingQueue = new Set<string>();
  private readonly maxQueueSize = 1000;
  private readonly maxProcessingSize = 50;

  constructor(
    @InjectRepository(GitLabEventLog)
    private readonly eventLogRepository: Repository<GitLabEventLog>,
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
  ) {}

  /**
   * 添加事件到队列
   */
  async enqueueEvent(eventLog: GitLabEventLog): Promise<boolean> {
    try {
      // 检查队列大小
      if (this.eventQueue.size >= this.maxQueueSize) {
        this.logger.warn(`事件队列已满，丢弃事件: ${eventLog.id}`);
        return false;
      }

      // 检查是否已存在
      if (this.eventQueue.has(eventLog.id) || this.processingQueue.has(eventLog.id)) {
        this.logger.debug(`事件已在队列�? ${eventLog.id}`);
        return false;
      }

      // 添加到队�?
      this.eventQueue.set(eventLog.id, eventLog);
      
      this.logger.debug(`事件已加入队�? ${eventLog.id}`, {
        eventId: eventLog.id,
        eventType: eventLog.eventType,
        queueSize: this.eventQueue.size,
      });

      return true;
    } catch (error:any) {
      this.logger.error(`添加事件到队列失�? ${error.message}`, {
        eventId: eventLog.id,
        error: error.stack,
      });
      return false;
    }
  }

  /**
   * 从队列获取事�?
   */
  async dequeueEvent(): Promise<GitLabEventLog | null> {
    try {
      // 检查处理队列大�?
      if (this.processingQueue.size >= this.maxProcessingSize) {
        return null;
      }

      // 按优先级获取事件
      const event = this.getNextEventByPriority();
      if (!event) {
        return null;
      }

      // 移动到处理队�?
      this.eventQueue.delete(event.id);
      this.processingQueue.add(event.id);

      this.logger.debug(`事件已从队列取出: ${event.id}`, {
        eventId: event.id,
        eventType: event.eventType,
        queueSize: this.eventQueue.size,
        processingSize: this.processingQueue.size,
      });

      return event;
    } catch (error:any)  {
      this.logger.error(`从队列获取事件失�? ${error.message}`, {
        error: error.stack,
      });
      return null;
    }
  }

  /**
   * 标记事件处理完成
   */
  async markEventCompleted(eventId: string, result: EventProcessResult): Promise<void> {
    try {
      this.processingQueue.delete(eventId);

      this.logger.debug(`事件处理完成: ${eventId}`, {
        eventId,
        success: result.success,
        message: result.message,
        queueSize: this.eventQueue.size,
        processingSize: this.processingQueue.size,
      });
    } catch (error:any)  {
      this.logger.error(`标记事件完成失败: ${error.message}`, {
        eventId,
        error: error.stack,
      });
    }
  }

  /**
   * 标记事件处理失败
   */
  async markEventFailed(eventId: string, error: string): Promise<void> {
    try {
      this.processingQueue.delete(eventId);

      this.logger.warn(`事件处理失败: ${eventId}`, {
        eventId,
        error,
        queueSize: this.eventQueue.size,
        processingSize: this.processingQueue.size,
      });
    } catch (err:any) {
      this.logger.error(`标记事件失败失败: ${err.message}`, {
        eventId,
        error: err.stack,
      });
    }
  }

  /**
   * 按优先级获取下一个事�?
   */
  private getNextEventByPriority(): GitLabEventLog | null {
    if (this.eventQueue.size === 0) {
      return null;
    }

    // 按优先级排序：pipeline > merge_request > issue > push
    const priorityOrder = ['pipeline', 'merge_request', 'issue', 'push'];
    
    for (const eventType of priorityOrder) {
      for (const [eventId, event] of this.eventQueue) {
        if (event.eventType === eventType) {
          return event;
        }
      }
    }

    // 如果没有找到按优先级的事件，返回第一�?
    return this.eventQueue.values().next().value || null;
  }

  /**
   * 获取队列状�?
   */
  getQueueStatus(): {
    queueSize: number;
    processingSize: number;
    maxQueueSize: number;
    maxProcessingSize: number;
    isFull: boolean;
    isProcessingFull: boolean;
  } {
    return {
      queueSize: this.eventQueue.size,
      processingSize: this.processingQueue.size,
      maxQueueSize: this.maxQueueSize,
      maxProcessingSize: this.maxProcessingSize,
      isFull: this.eventQueue.size >= this.maxQueueSize,
      isProcessingFull: this.processingQueue.size >= this.maxProcessingSize,
    };
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.eventQueue.clear();
    this.processingQueue.clear();
    
    this.logger.log('事件队列已清空');
  }

  /**
   * 获取队列中的事件列表
   */
  getQueuedEvents(): GitLabEventLog[] {
    return Array.from(this.eventQueue.values());
  }

  /**
   * 获取正在处理的事件列表
   */
  getProcessingEvents(): string[] {
    return Array.from(this.processingQueue);
  }

  /**
   * 检查事件是否在队列中
   */
  isEventInQueue(eventId: string): boolean {
    return this.eventQueue.has(eventId) || this.processingQueue.has(eventId);
  }

  /**
   * 从队列中移除事件
   */
  removeEventFromQueue(eventId: string): boolean {
    const wasInQueue = this.eventQueue.has(eventId);
    const wasProcessing = this.processingQueue.has(eventId);
    
    this.eventQueue.delete(eventId);
    this.processingQueue.delete(eventId);

    if (wasInQueue || wasProcessing) {
      this.logger.debug(`事件已从队列移除: ${eventId}`, {
        eventId,
        wasInQueue,
        wasProcessing,
      });
      return true;
    }

    return false;
  }

  /**
   * 批量添加事件到队列
   */
  async enqueueEvents(eventLogs: GitLabEventLog[]): Promise<{
    total: number;
    enqueued: number;
    skipped: number;
  }> {
    let enqueued = 0;
    let skipped = 0;

    for (const eventLog of eventLogs) {
      const success = await this.enqueueEvent(eventLog);
      if (success) {
        enqueued++;
      } else {
        skipped++;
      }
    }

    this.logger.log(`批量添加事件到队列完成`, {
      total: eventLogs.length,
      enqueued,
      skipped,
    });

    return {
      total: eventLogs.length,
      enqueued,
      skipped,
    };
  }

  /**
   * 获取队列统计信息
   */
  getQueueStatistics(): {
    totalEvents: number;
    queuedEvents: number;
    processingEvents: number;
    queueUtilization: number;
    processingUtilization: number;
    eventTypeDistribution: Record<string, number>;
  } {
    const queuedEvents = this.eventQueue.size;
    const processingEvents = this.processingQueue.size;
    const totalEvents = queuedEvents + processingEvents;

    // 计算事件类型分布
    const eventTypeDistribution: Record<string, number> = {};
    for (const event of this.eventQueue.values()) {
      eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1;
    }

    return {
      totalEvents,
      queuedEvents,
      processingEvents,
      queueUtilization: (queuedEvents / this.maxQueueSize) * 100,
      processingUtilization: (processingEvents / this.maxProcessingSize) * 100,
      eventTypeDistribution,
    };
  }

  /**
   * 检查队列健康状态
   */
  isQueueHealthy(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const status = this.getQueueStatus();

    // 检查队列是否已满
    if (status.isFull) {
      issues.push('事件队列已满');
      recommendations.push('考虑增加队列大小或检查事件处理性能');
    }

    // 检查处理队列是否已满
    if (status.isProcessingFull) {
      issues.push('处理队列已满');
      recommendations.push('考虑增加处理并发数或检查事件处理逻辑');
    }

    // 检查队列利用率
    const queueUtilization = (status.queueSize / status.maxQueueSize) * 100;
    if (queueUtilization > 80) {
      issues.push(`队列利用率过高: ${queueUtilization.toFixed(2)}%`);
      recommendations.push('监控队列状态，考虑优化事件处理');
    }

    // 检查处理队列利用率
    const processingUtilization = (status.processingSize / status.maxProcessingSize) * 100;
    if (processingUtilization > 80) {
      issues.push(`处理队列利用率过高: ${processingUtilization.toFixed(2)}%`);
      recommendations.push('检查事件处理性能，考虑增加处理能力');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
