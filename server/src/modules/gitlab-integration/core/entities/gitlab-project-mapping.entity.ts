import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { ProjectEntity as Project } from '../../../projects/project.entity';
import { GitLabInstance } from './gitlab-instance.entity';
import { GitLabSyncStatus } from './gitlab-sync-status.entity';

/**
 * GitLab项目映射实体
 * 用于建立项目管理工具项目与GitLab项目的映射关系
 */
@Entity('gitlab_project_mappings')
@Index('idx_gitlab_mappings_project', ['projectId'])
@Index('idx_gitlab_mappings_instance', ['gitlabInstanceId'])
@Index('idx_gitlab_mappings_gitlab_project', ['gitlabProjectId'])
@Index('idx_gitlab_mappings_active', ['isActive'])
@Index('unique_mapping', ['projectId', 'gitlabInstanceId', 'gitlabProjectId'], { unique: true })
export class GitLabProjectMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * 项目管理工具项目ID
   */
  @Column({ type: 'varchar', length: 36, comment: '项目管理工具项目ID' })
  projectId!: string;

  /**
   * GitLab实例ID
   */
  @Column({ type: 'varchar', length: 36, comment: 'GitLab实例ID' })
  gitlabInstanceId!: string;

  /**
   * GitLab项目ID
   */
  @Column({ type: 'int', comment: 'GitLab项目ID' })
  gitlabProjectId!: number;

  /**
   * GitLab项目路径
   */
  @Column({ type: 'varchar', length: 500, comment: 'GitLab项目路径' })
  gitlabProjectPath!: string;

  /**
   * GitLab Webhook ID
   */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: 'GitLab Webhook ID' })
  webhookId?: string;

  /**
   * 是否激活
   */
  @Column({ type: 'boolean', default: true, comment: '是否激活' })
  isActive!: boolean;

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
   * 关联的项目
   */
  @ManyToOne(() => Project, project => project.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  /**
   * 关联的GitLab实例
   */
  @ManyToOne(() => GitLabInstance, instance => instance.projectMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gitlabInstanceId' })
  gitlabInstance!: GitLabInstance;

  /**
   * 关联的同步状态
   */
  @OneToOne(() => GitLabSyncStatus, status => status.mapping, { cascade: true })
  syncStatus!: GitLabSyncStatus;

  /**
   * 获取GitLab项目URL
   */
  getGitLabProjectUrl(): string {
    if (!this.gitlabInstance) {
      return '';
    }
    const baseUrl = this.gitlabInstance.baseUrl.endsWith('/') 
      ? this.gitlabInstance.baseUrl.slice(0, -1) 
      : this.gitlabInstance.baseUrl;
    return `${baseUrl}/${this.gitlabProjectPath}`;
  }

  /**
   * 获取GitLab API URL
   */
  getGitLabApiUrl(endpoint: string = ''): string {
    if (!this.gitlabInstance) {
      return '';
    }
    const baseUrl = this.gitlabInstance.baseUrl.endsWith('/') 
      ? this.gitlabInstance.baseUrl.slice(0, -1) 
      : this.gitlabInstance.baseUrl;
    return `${baseUrl}/api/v4/projects/${this.gitlabProjectId}${endpoint}`;
  }

  /**
   * 验证映射配置是否完整
   */
  isValid(): boolean {
    return !!(this.projectId && this.gitlabInstanceId && this.gitlabProjectId && this.gitlabProjectPath);
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    return `${this.project?.name || 'Unknown Project'} ↔ ${this.gitlabProjectPath}`;
  }
}
