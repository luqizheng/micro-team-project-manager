import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { createHash } from 'crypto';
import { GitLabEventLog } from '../entities/gitlab-event-log.entity';
import { GitLabWebhookEvent } from '../interfaces/gitlab-api.interface';

/**
 * GitLab事件去重服务
 * 负责事件去重、幂等性检查和重复事件处理
 */
@Injectable()
export class GitLabEventDeduplicationService {
  private readonly logger = new Logger(GitLabEventDeduplicationService.name);
  private readonly deduplicationWindow = 5 * 60 * 1000; // 5分钟去重窗口
  private readonly maxDeduplicationCache = 10000; // 最大去重缓存大小
  private readonly eventHashes = new Map<string, number>(); // 事件哈希 -> 时间戳

  constructor(
    @InjectRepository(GitLabEventLog)
    private readonly eventLogRepository: Repository<GitLabEventLog>,
  ) {}

  /**
   * 检查事件是否重复
   */
  async isDuplicateEvent(event: GitLabWebhookEvent, instanceId: string): Promise<{
    isDuplicate: boolean;
    duplicateEventId?: string;
    reason?: string;
  }> {
    try {
      // 生成事件指纹
      const eventFingerprint = this.generateEventFingerprint(event, instanceId);
      
      // 检查内存缓存
      const cachedTimestamp = this.eventHashes.get(eventFingerprint);
      if (cachedTimestamp) {
        const age = Date.now() - cachedTimestamp;
        if (age < this.deduplicationWindow) {
          this.logger.debug(`发现重复事件（内存缓存）: ${eventFingerprint}`, {
            eventType: event.object_kind,
            projectId: event.project?.id,
            age,
          });
          return {
            isDuplicate: true,
            reason: '内存缓存中发现重复事件',
          };
        }
      }

      // 检查数据库
      const duplicateEvent = await this.findDuplicateEventInDatabase(event, instanceId);
      if (duplicateEvent) {
        this.logger.debug(`发现重复事件（数据库）: ${eventFingerprint}`, {
          eventType: event.object_kind,
          projectId: event.project?.id,
          duplicateEventId: duplicateEvent.id,
        });
        return {
          isDuplicate: true,
          duplicateEventId: duplicateEvent.id,
          reason: '数据库中发现重复事件',
        };
      }

      // 添加到内存缓存
      this.addToCache(eventFingerprint);
      
      return {
        isDuplicate: false,
      };

    } catch (error) {
      this.logger.error(`检查事件重复性失败: ${error.message}`, {
        eventType: event.object_kind,
        projectId: event.project?.id,
        error: error.stack,
      });
      
      // 出错时默认不认为是重复事件
      return {
        isDuplicate: false,
      };
    }
  }

  /**
   * 生成事件指纹
   */
  private generateEventFingerprint(event: GitLabWebhookEvent, instanceId: string): string {
    const keyComponents = [
      instanceId,
      event.object_kind,
      event.project?.id?.toString() || '',
      event.object_attributes?.id?.toString() || '',
      event.object_attributes?.iid?.toString() || '',
      event.object_attributes?.action || '',
      event.created_at || '',
    ];

    const key = keyComponents.join('|');
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * 在数据库中查找重复事件
   */
  private async findDuplicateEventInDatabase(
    event: GitLabWebhookEvent,
    instanceId: string,
  ): Promise<GitLabEventLog | null> {
    try {
      const windowStart = new Date(Date.now() - this.deduplicationWindow);
      
      // 查找相同类型和项目的事件
      const events = await this.eventLogRepository.find({
        where: {
          gitlabInstanceId: instanceId,
          eventType: event.object_kind,
          createdAt: LessThan(new Date()),
        },
        order: { createdAt: 'DESC' },
        take: 100, // 限制查询数量
      });

      // 在内存中比较事件内容
      for (const existingEvent of events) {
        if (this.isEventContentIdentical(event, existingEvent.eventData)) {
          return existingEvent;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`在数据库中查找重复事件失败: ${error.message}`, {
        eventType: event.object_kind,
        projectId: event.project?.id,
        error: error.stack,
      });
      return null;
    }
  }

  /**
   * 比较事件内容是否相同
   */
  private isEventContentIdentical(event1: GitLabWebhookEvent, event2: any): boolean {
    try {
      // 比较关键字段
      const keyFields = [
        'object_kind',
        'project.id',
        'object_attributes.id',
        'object_attributes.iid',
        'object_attributes.action',
        'created_at',
      ];

      for (const field of keyFields) {
        const value1 = this.getNestedValue(event1, field);
        const value2 = this.getNestedValue(event2, field);
        
        if (value1 !== value2) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`比较事件内容失败: ${error.message}`, {
        error: error.stack,
      });
      return false;
    }
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 添加到内存缓存
   */
  private addToCache(eventFingerprint: string): void {
    // 清理过期缓存
    this.cleanupExpiredCache();
    
    // 检查缓存大小
    if (this.eventHashes.size >= this.maxDeduplicationCache) {
      this.logger.warn('去重缓存已满，清理最旧的条目');
      this.clearOldestCacheEntries();
    }
    
    // 添加新条目
    this.eventHashes.set(eventFingerprint, Date.now());
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, timestamp] of this.eventHashes) {
      if (now - timestamp > this.deduplicationWindow) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.eventHashes.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.debug(`清理了 ${expiredKeys.length} 个过期的去重缓存条目`);
    }
  }

  /**
   * 清理最旧的缓存条目
   */
  private clearOldestCacheEntries(): void {
    const entries = Array.from(this.eventHashes.entries());
    entries.sort((a, b) => a[1] - b[1]); // 按时间戳排序
    
    const toRemove = Math.floor(this.maxDeduplicationCache * 0.1); // 移除10%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.eventHashes.delete(entries[i][0]);
    }
  }

  /**
   * 处理重复事件
   */
  async handleDuplicateEvent(
    event: GitLabWebhookEvent,
    instanceId: string,
    duplicateEventId: string,
  ): Promise<{
    action: 'skip' | 'update' | 'retry';
    message: string;
  }> {
    try {
      const duplicateEvent = await this.eventLogRepository.findOne({
        where: { id: duplicateEventId },
      });

      if (!duplicateEvent) {
        return {
          action: 'skip',
          message: '重复事件不存在',
        };
      }

      // 如果重复事件已处理成功，跳过
      if (duplicateEvent.processed && !duplicateEvent.errorMessage) {
        this.logger.debug(`跳过重复事件（已处理）: ${duplicateEventId}`, {
          eventType: event.object_kind,
          projectId: event.project?.id,
        });
        return {
          action: 'skip',
          message: '重复事件已处理成功',
        };
      }

      // 如果重复事件处理失败，重试
      if (duplicateEvent.processed && duplicateEvent.errorMessage) {
        this.logger.debug(`重试重复事件（处理失败）: ${duplicateEventId}`, {
          eventType: event.object_kind,
          projectId: event.project?.id,
        });
        return {
          action: 'retry',
          message: '重复事件处理失败，将重试',
        };
      }

      // 如果重复事件未处理，更新事件数据
      this.logger.debug(`更新重复事件数据: ${duplicateEventId}`, {
        eventType: event.object_kind,
        projectId: event.project?.id,
      });
      return {
        action: 'update',
        message: '更新重复事件数据',
      };

    } catch (error) {
      this.logger.error(`处理重复事件失败: ${error.message}`, {
        eventType: event.object_kind,
        projectId: event.project?.id,
        duplicateEventId,
        error: error.stack,
      });
      
      return {
        action: 'skip',
        message: '处理重复事件时出错',
      };
    }
  }

  /**
   * 获取去重统计信息
   */
  getDeduplicationStatistics(): {
    cacheSize: number;
    maxCacheSize: number;
    cacheUtilization: number;
    deduplicationWindow: number;
    recentDuplicates: number;
  } {
    const cacheSize = this.eventHashes.size;
    const maxCacheSize = this.maxDeduplicationCache;
    const cacheUtilization = (cacheSize / maxCacheSize) * 100;
    
    // 计算最近5分钟内的重复事件数量（简化实现）
    const now = Date.now();
    const recentDuplicates = Array.from(this.eventHashes.values())
      .filter(timestamp => now - timestamp < this.deduplicationWindow)
      .length;

    return {
      cacheSize,
      maxCacheSize,
      cacheUtilization,
      deduplicationWindow: this.deduplicationWindow,
      recentDuplicates,
    };
  }

  /**
   * 清理去重缓存
   */
  clearDeduplicationCache(): void {
    this.eventHashes.clear();
    this.logger.log('去重缓存已清空');
  }

  /**
   * 检查去重服务健康状态
   */
  isDeduplicationHealthy(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const stats = this.getDeduplicationStatistics();

    // 检查缓存利用率
    if (stats.cacheUtilization > 90) {
      issues.push(`去重缓存利用率过高: ${stats.cacheUtilization.toFixed(2)}%`);
      recommendations.push('考虑增加缓存大小或优化去重逻辑');
    }

    // 检查重复事件数量
    if (stats.recentDuplicates > 100) {
      issues.push(`最近重复事件过多: ${stats.recentDuplicates}`);
      recommendations.push('检查GitLab配置，可能存在重复发送事件的问题');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
