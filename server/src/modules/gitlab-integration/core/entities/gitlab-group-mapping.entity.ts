import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { ProjectEntity as Project } from '../../../projects/project.entity';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabSyncStatus } from './gitlab-sync-status.entity';

/**
 * GitLab分组映射实体
 * 用于建立项目管理工具项目与GitLab分组的映射关�?
 */
@Entity('gitlab_group_mappings')
@Index('idx_gitlab_group_mappings_project', ['projectId'])
@Index('idx_gitlab_group_mappings_instance', ['gitlabInstanceId'])
@Index('idx_gitlab_group_mappings_gitlab_group', ['gitlabGroupId'])
@Index('idx_gitlab_group_mappings_active', ['isActive'])
@Index('unique_group_mapping', ['projectId', 'gitlabInstanceId', 'gitlabGroupId'], { unique: true })
export class GitLabGroupMapping {
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
   * GitLab分组ID
   */
  @Column({ type: 'int', comment: 'GitLab分组ID' })
  gitlabGroupId!: number;

  /**
   * GitLab分组路径
   */
  @Column({ type: 'varchar', length: 500, comment: 'GitLab分组路径' })
  gitlabGroupPath!: string;

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
  @ManyToOne(() => GitLabInstance, instance => instance.groupMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gitlabInstanceId' })
  gitlabInstance!: GitLabInstance;

  /**
   * 关联的同步状态
   */
  // @OneToOne(() => GitLabSyncStatus, status => status.mapping, { cascade: true })
  // syncStatus!: GitLabSyncStatus;

  /**
   * 获取GitLab分组URL
   */
  getGitLabGroupUrl(): string {
    if (!this.gitlabInstance) {
      return '';
    }
    const baseUrl = this.gitlabInstance.baseUrl.endsWith('/') 
      ? this.gitlabInstance.baseUrl.slice(0, -1) 
      : this.gitlabInstance.baseUrl;
    return `${baseUrl}/groups/${this.gitlabGroupPath}`;
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
    return `${baseUrl}/api/v4/groups/${this.gitlabGroupId}${endpoint}`;
  }

  /**
   * 验证映射配置是否完整
   */
  isValid(): boolean {
    return !!(this.projectId && this.gitlabInstanceId && this.gitlabGroupId && this.gitlabGroupPath);
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    return `${this.project?.name || 'Unknown Project'} ${this.gitlabGroupPath}`;
  }
}
