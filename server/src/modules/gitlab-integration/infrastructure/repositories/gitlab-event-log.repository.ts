/**
 * GitLab事件日志仓储
 * 负责GitLab事件日志的数据访问
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabEventLog } from '../../core/entities/gitlab-event-log.entity';
import { IGitLabEventLogRepository } from '../../core/interfaces/gitlab-repository.interface';

/**
 * GitLab事件日志仓储实现
 * 提供GitLab事件日志的数据访问功能
 */
@Injectable()
export class GitLabEventLogRepository implements IGitLabEventLogRepository {
  private readonly logger = new Logger(GitLabEventLogRepository.name);

  constructor(
    @InjectRepository(GitLabEventLog)
    private readonly repository: Repository<GitLabEventLog>,
  ) {}

  /**
   * 根据ID查找事件日志
   */
  async findById(id: string): Promise<GitLabEventLog | null> {
    try {
      const eventLog = await this.repository.findOne({
        where: { id },
        relations: ['gitlabInstance'],
      });
      
      this.logger.debug(`查找事件日志: ${id}, 结果: ${eventLog ? '找到' : '未找到'}`);
      return eventLog;
    } catch (error) {
      this.logger.error(`查找事件日志失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据实例ID查找事件日志
   */
  async findByInstanceId(instanceId: string, limit?: number): Promise<GitLabEventLog[]> {
    try {
      const query = this.repository
        .createQueryBuilder('eventLog')
        .leftJoinAndSelect('eventLog.gitlabInstance', 'instance')
        .where('instance.id = :instanceId', { instanceId })
        .orderBy('eventLog.createdAt', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      const eventLogs = await query.getMany();
      
      this.logger.debug(`根据实例ID查找事件日志: ${instanceId}, 结果数量: ${eventLogs.length}`);
      return eventLogs;
    } catch (error) {
      this.logger.error(`根据实例ID查找事件日志失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 保存事件日志
   */
  async save(eventLog: GitLabEventLog): Promise<GitLabEventLog> {
    try {
      const savedEventLog = await this.repository.save(eventLog);
      this.logger.debug(`保存事件日志: ${savedEventLog.id}`);
      return savedEventLog;
    } catch (error) {
      this.logger.error(`保存事件日志失败: ${eventLog.id}`, error);
      throw error;
    }
  }

  /**
   * 批量保存事件日志
   */
  async saveMany(eventLogs: GitLabEventLog[]): Promise<GitLabEventLog[]> {
    try {
      const savedEventLogs = await this.repository.save(eventLogs);
      this.logger.debug(`批量保存事件日志: ${savedEventLogs.length} 个`);
      return savedEventLogs;
    } catch (error) {
      this.logger.error(`批量保存事件日志失败: ${eventLogs.length} 个`, error);
      throw error;
    }
  }

  /**
   * 删除过期的事件日志
   */
  async deleteExpired(days: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.repository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.debug(`删除过期事件日志: ${result.affected} 条记录`);
    } catch (error) {
      this.logger.error(`删除过期事件日志失败: ${days} 天`, error);
      throw error;
    }
  }

  /**
   * 根据事件类型查找事件日志
   */
  async findByEventType(instanceId: string, eventType: string, limit?: number): Promise<GitLabEventLog[]> {
    try {
      const query = this.repository
        .createQueryBuilder('eventLog')
        .leftJoinAndSelect('eventLog.gitlabInstance', 'instance')
        .where('instance.id = :instanceId', { instanceId })
        .andWhere('eventLog.eventType = :eventType', { eventType })
        .orderBy('eventLog.createdAt', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      const eventLogs = await query.getMany();
      
      this.logger.debug(`根据事件类型查找事件日志: ${instanceId}:${eventType}, 结果数量: ${eventLogs.length}`);
      return eventLogs;
    } catch (error) {
      this.logger.error(`根据事件类型查找事件日志失败: ${instanceId}:${eventType}`, error);
      throw error;
    }
  }

  /**
   * 根据事件状态查找事件日志
   */
  async findByEventStatus(instanceId: string, eventStatus: string, limit?: number): Promise<GitLabEventLog[]> {
    try {
      const query = this.repository
        .createQueryBuilder('eventLog')
        .leftJoinAndSelect('eventLog.gitlabInstance', 'instance')
        .where('instance.id = :instanceId', { instanceId })
        .andWhere('eventLog.eventStatus = :eventStatus', { eventStatus })
        .orderBy('eventLog.createdAt', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      const eventLogs = await query.getMany();
      
      this.logger.debug(`根据事件状态查找事件日志: ${instanceId}:${eventStatus}, 结果数量: ${eventLogs.length}`);
      return eventLogs;
    } catch (error) {
      this.logger.error(`根据事件状态查找事件日志失败: ${instanceId}:${eventStatus}`, error);
      throw error;
    }
  }

  /**
   * 根据时间范围查找事件日志
   */
  async findByDateRange(instanceId: string, startDate: Date, endDate: Date, limit?: number): Promise<GitLabEventLog[]> {
    try {
      const query = this.repository
        .createQueryBuilder('eventLog')
        .leftJoinAndSelect('eventLog.gitlabInstance', 'instance')
        .where('instance.id = :instanceId', { instanceId })
        .andWhere('eventLog.createdAt >= :startDate', { startDate })
        .andWhere('eventLog.createdAt <= :endDate', { endDate })
        .orderBy('eventLog.createdAt', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      const eventLogs = await query.getMany();
      
      this.logger.debug(`根据时间范围查找事件日志: ${instanceId}:${startDate}-${endDate}, 结果数量: ${eventLogs.length}`);
      return eventLogs;
    } catch (error) {
      this.logger.error(`根据时间范围查找事件日志失败: ${instanceId}:${startDate}-${endDate}`, error);
      throw error;
    }
  }

  /**
   * 统计事件日志数量
   */
  async count(): Promise<number> {
    try {
      const count = await this.repository.count();
      this.logger.debug(`统计事件日志数量: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('统计事件日志数量失败', error);
      throw error;
    }
  }

  /**
   * 根据实例ID统计事件日志数量
   */
  async countByInstanceId(instanceId: string): Promise<number> {
    try {
      const count = await this.repository.count({ 
        where: { gitlabInstance: { id: instanceId } } 
      });
      this.logger.debug(`根据实例ID统计事件日志数量: ${instanceId}, 结果: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`根据实例ID统计事件日志数量失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 根据事件类型统计事件日志数量
   */
  async countByEventType(instanceId: string, eventType: string): Promise<number> {
    try {
      const count = await this.repository.count({ 
        where: { 
          gitlabInstance: { id: instanceId },
          eventType: eventType,
        } 
      });
      this.logger.debug(`根据事件类型统计事件日志数量: ${instanceId}:${eventType}, 结果: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`根据事件类型统计事件日志数量失败: ${instanceId}:${eventType}`, error);
      throw error;
    }
  }

  /**
   * 根据事件状态统计事件日志数量
   */
  async countByEventStatus(instanceId: string, eventStatus: string): Promise<number> {
    try {
      const count = await this.repository.count({ 
        where: { 
          gitlabInstance: { id: instanceId },
          eventStatus: eventStatus,
        } 
      });
      this.logger.debug(`根据事件状态统计事件日志数量: ${instanceId}:${eventStatus}, 结果: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`根据事件状态统计事件日志数量失败: ${instanceId}:${eventStatus}`, error);
      throw error;
    }
  }

  /**
   * 获取事件日志统计信息
   */
  async getEventStatistics(instanceId: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byDate: Record<string, number>;
  }> {
    try {
      const query = this.repository
        .createQueryBuilder('eventLog')
        .leftJoin('eventLog.gitlabInstance', 'instance')
        .where('instance.id = :instanceId', { instanceId });

      if (startDate) {
        query.andWhere('eventLog.createdAt >= :startDate', { startDate });
      }
      if (endDate) {
        query.andWhere('eventLog.createdAt <= :endDate', { endDate });
      }

      const eventLogs = await query.getMany();

      const statistics = {
        total: eventLogs.length,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byDate: {} as Record<string, number>,
      };

      eventLogs.forEach(eventLog => {
        // 按类型统计
        statistics.byType[eventLog.eventType] = (statistics.byType[eventLog.eventType] || 0) + 1;
        
        // 按状态统计
        statistics.byStatus[eventLog.eventStatus] = (statistics.byStatus[eventLog.eventStatus] || 0) + 1;
        
        // 按日期统计
        const date = eventLog.createdAt.toISOString().split('T')[0];
        statistics.byDate[date] = (statistics.byDate[date] || 0) + 1;
      });

      this.logger.debug(`获取事件日志统计信息: ${instanceId}, 结果: ${JSON.stringify(statistics)}`);
      return statistics;
    } catch (error) {
      this.logger.error(`获取事件日志统计信息失败: ${instanceId}`, error);
      throw error;
    }
  }
}
