import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GitLabInstance } from './gitlab-instance.entity';

/**
 * GitLab事件日志实体
 * 用于记录从GitLab接收到的Webhook事件
 */
@Entity('gitlab_event_logs')
@Index('idx_gitlab_events_instance', ['gitlabInstanceId'])
@Index('idx_gitlab_events_type', ['eventType'])
@Index('idx_gitlab_events_processed', ['processed'])
@Index('idx_gitlab_events_created_at', ['createdAt'])
@Index('idx_gitlab_events_retry', ['retryCount', 'processed'])
export class GitLabEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * GitLab实例ID
   */
  @Column({ type: 'varchar', length: 36, comment: 'GitLab实例ID' })
  gitlabInstanceId: string;

  /**
   * 事件类型
   */
  @Column({ type: 'varchar', length: 50, comment: '事件类型' })
  eventType: string;

  /**
   * 事件数据
   */
  @Column({ type: 'json', comment: '事件数据' })
  eventData: any;

  /**
   * 是否已处理
   */
  @Column({ type: 'boolean', default: false, comment: '是否已处理' })
  processed: boolean;

  /**
   * 错误信息
   */
  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage?: string;

  /**
   * 重试次数
   */
  @Column({ type: 'int', default: 0, comment: '重试次数' })
  retryCount: number;

  /**
   * 创建时间
   */
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  /**
   * 处理时间
   */
  @Column({ type: 'timestamp', nullable: true, comment: '处理时间' })
  processedAt?: Date;

  /**
   * 关联的GitLab实例
   */
  @ManyToOne(() => GitLabInstance, instance => instance.eventLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gitlabInstanceId' })
  gitlabInstance: GitLabInstance;

  /**
   * 标记为已处理
   */
  markAsProcessed(): void {
    this.processed = true;
    this.processedAt = new Date();
  }

  /**
   * 标记为失败
   */
  markAsFailed(errorMessage: string): void {
    this.processed = false;
    this.errorMessage = errorMessage;
    this.retryCount += 1;
  }

  /**
   * 重置重试计数
   */
  resetRetryCount(): void {
    this.retryCount = 0;
    this.errorMessage = null;
  }

  /**
   * 检查是否可以重试
   */
  canRetry(maxRetries: number = 5): boolean {
    return !this.processed && this.retryCount < maxRetries;
  }

  /**
   * 获取事件摘要
   */
  getEventSummary(): string {
    const data = this.eventData || {};
    const project = data.project?.name || data.project?.path_with_namespace || 'Unknown Project';
    const action = data.object_attributes?.action || data.action || 'unknown';
    return `${this.eventType} - ${action} - ${project}`;
  }

  /**
   * 获取事件年龄（小时）
   */
  getAgeInHours(): number {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * 检查事件是否过期
   */
  isExpired(maxAgeHours: number = 24): boolean {
    return this.getAgeInHours() > maxAgeHours;
  }
}
