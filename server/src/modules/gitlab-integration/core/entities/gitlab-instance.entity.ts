import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { GitLabEventLog } from './gitlab-event-log.entity';
import { GitLabUserMapping } from './gitlab-user-mapping.entity';
import { GitLabGroupMapping } from './gitlab-group-mapping.entity';
import { GitLabProjectMapping } from './gitlab-project-mapping.entity';

/**
 * GitLab实例配置实体
 * 用于存储GitLab实例的连接信息和配置
 */
@Entity('gitlab_instances')
@Index('idx_gitlab_instances_active', ['isActive'])
@Index('idx_gitlab_instances_type', ['instanceType'])
@Index('idx_gitlab_instances_created_at', ['createdAt'])
export class GitLabInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 实例名称
   */
  @Column({ type: 'varchar', length: 100, comment: '实例名称' })
  name!: string;

  /**
   * GitLab实例基础URL
   */
  @Column({ type: 'varchar', length: 500, comment: 'GitLab实例基础URL' })
  baseUrl!: string;

  /**
   * API访问令牌（加密存储）
   */
  @Column({ type: 'varchar', length: 500, comment: 'API访问令牌（加密存储）' })
  apiToken!: string;

  /**
   * Webhook签名密钥
   */
  @Column({ type: 'varchar', length: 128, nullable: true, comment: 'Webhook签名密钥' })
  webhookSecret?: string;

  /**
   * 是否激活
   */
  @Column({ type: 'boolean', default: true, comment: '是否激活' })
  isActive!: boolean;

  /**
   * 实例类型
   */
  @Column({ 
    type: 'enum', 
    enum: ['self_hosted', 'gitlab_com'], 
    default: 'self_hosted',
    comment: '实例类型'
  })
  instanceType!: 'self_hosted' | 'gitlab_com';

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
   * 关联的事件日�?
   */
  @OneToMany(() => GitLabEventLog, event => event.gitlabInstance)
  eventLogs!: GitLabEventLog[];

  /**
   * 关联的用户映�?
   */
  @OneToMany(() => GitLabUserMapping, mapping => mapping.gitlabInstance)
  userMappings!: GitLabUserMapping[];

  /**
   * 关联的分组映�?
   */
  @OneToMany(() => GitLabGroupMapping, mapping => mapping.gitlabInstance)
  groupMappings!: GitLabGroupMapping[];

  /**
   * 关联的项目映�?
   */
  @OneToMany(() => GitLabProjectMapping, mapping => mapping.gitlabInstance)
  projectMappings!: GitLabProjectMapping[];

  /**
   * 获取完整的API URL
   */
  getApiUrl(endpoint: string = ''): string {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    //const apiPath = '/api/v4';
    return `${baseUrl}${endpoint}`;
  }

  /**
   * 获取Webhook URL
   */
  getWebhookUrl(): string {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    return `${baseUrl}/api/v4/projects/:project_id/hooks`;
  }

  /**
   * 验证实例配置是否完整
   */
  isValid(): boolean {
    return !!(this.name && this.baseUrl && this.apiToken);
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    return `${this.name} (${this.baseUrl})`;
  }
}
