import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { GitLabProjectMapping } from './gitlab-project-mapping.entity';

/**
 * GitLab同步状态实体
 */
@Entity('gitlab_sync_status')
export class GitLabSyncStatus {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * GitLab实例ID
   */
  @Column({ type: 'varchar', length: 36, comment: 'GitLab实例ID' })
  gitlabInstanceId!: string;

  /**
   * 项目ID
   */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: '项目ID' })
  projectId?: string;

  /**
   * 同步类型
   */
  @Column({
    type: 'enum',
    enum: ['incremental', 'full', 'compensation'],
    default: 'incremental',
    comment: '同步类型'
  })
  syncType!: 'incremental' | 'full' | 'compensation';

  /**
   * 同步状态
   */
  @Column({
    type: 'enum',
    enum: ['success', 'failed', 'in_progress', 'completed'],
    default: 'in_progress',
    comment: '同步状态'
  })
  status!: 'success' | 'failed' | 'in_progress' | 'completed';

  /**
   * 同步统计信息
   */
  @Column({ type: 'json', nullable: true, comment: '同步统计信息' })
  statistics?: any;

  /**
   * 最后同步时间
   */
  @Column({ type: 'timestamp', nullable: true, comment: '最后同步时间' })
  lastSyncAt?: Date;

  /**
   * 错误信息
   */
  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage?: string;

  /**
   * 同步次数
   */
  @Column({ type: 'int', default: 0, comment: '同步次数' })
  syncCount!: number;

  /**
   * 创建时间
   */
  @CreateDateColumn({ comment: '创建时间' })
  createdAt!: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt!: Date;

  /**
   * 关联的项目映射
   */
  @OneToOne(() => GitLabProjectMapping, mapping => mapping.syncStatus, { onDelete: 'CASCADE' })
  mapping?: GitLabProjectMapping;

  /**
   * 标记同步成功
   */
  markSyncSuccess(): void {
    this.status = 'success';
    this.lastSyncAt = new Date();
    this.syncCount += 1;
    this.errorMessage = undefined;
  }

  /**
   * 标记同步失败
   */
  markSyncFailed(errorMessage: string): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.syncCount += 1;
  }

  /**
   * 标记同步进行中
   */
  markSyncInProgress(): void {
    this.status = 'in_progress';
    this.errorMessage = undefined;
  }

  /**
   * 重置同步状态
   */
  resetSyncStatus(): void {
    this.status = 'in_progress';
    this.errorMessage = undefined;
    this.syncCount = 0;
  }

  /**
   * 检查是否可以重试同步
   */
  canRetrySync(maxRetries: number = 5): boolean {
    return this.status === 'failed' && this.syncCount < maxRetries;
  }

  /**
   * 获取同步间隔（分钟）
   */
  getSyncIntervalMinutes(): number {
    if (!this.lastSyncAt) {
      return 0;
    }
    const now = new Date();
    const diff = now.getTime() - this.lastSyncAt.getTime();
    return Math.floor(diff / (1000 * 60));
  }

  /**
   * 检查是否需要同步
   */
  needsSync(intervalMinutes: number = 60): boolean {
    if (this.status === 'in_progress') {
      return false;
    }
    return this.getSyncIntervalMinutes() >= intervalMinutes;
  }

  /**
   * 获取状态描述
   */
  getStatusDescription(): string {
    switch (this.status) {
      case 'success':
        return `同步成功 (${this.syncCount}次)`;
      case 'failed':
        return `同步失败 (${this.syncCount}次 - ${this.errorMessage || '未知错误'}`;
      case 'in_progress':
        return '同步进行中';
      case 'completed':
        return '同步完成';
      default:
        return '未知状态';
    }
  }

  /**
    * 获取最后同步时间描述
   */
  getLastSyncDescription(): string {
    if (!this.lastSyncAt) {
      return '从未同步';
    }
    const now = new Date();
    const diff = now.getTime() - this.lastSyncAt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) {
      return '刚刚同步';
    } else if (minutes < 60) {
      return `${minutes}分钟前同步`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}小时前同步`;
    }
  }
}
