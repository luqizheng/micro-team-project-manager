import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';
import { GitLabInstance } from './gitlab-instance.entity';

/**
 * GitLab用户映射实体
 * 用于建立项目管理工具用户与GitLab用户的映射关系
 */
@Entity('gitlab_user_mappings')
@Index('idx_gitlab_user_mappings_user', ['userId'])
@Index('idx_gitlab_user_mappings_instance', ['gitlabInstanceId'])
@Index('idx_gitlab_user_mappings_gitlab_user', ['gitlabUserId'])
@Index('unique_user_mapping', ['userId', 'gitlabInstanceId'], { unique: true })
@Index('unique_gitlab_user', ['gitlabInstanceId', 'gitlabUserId'], { unique: true })
export class GitLabUserMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 项目管理工具用户ID
   */
  @Column({ type: 'varchar', length: 36, comment: '项目管理工具用户ID' })
  userId: string;

  /**
   * GitLab实例ID
   */
  @Column({ type: 'varchar', length: 36, comment: 'GitLab实例ID' })
  gitlabInstanceId: string;

  /**
   * GitLab用户ID
   */
  @Column({ type: 'int', comment: 'GitLab用户ID' })
  gitlabUserId: number;

  /**
   * GitLab用户名
   */
  @Column({ type: 'varchar', length: 255, comment: 'GitLab用户名' })
  gitlabUsername: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  /**
   * 关联的用户
   */
  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * 关联的GitLab实例
   */
  @ManyToOne(() => GitLabInstance, instance => instance.userMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gitlabInstanceId' })
  gitlabInstance: GitLabInstance;

  /**
   * 获取GitLab用户URL
   */
  getGitLabUserUrl(): string {
    if (!this.gitlabInstance) {
      return '';
    }
    const baseUrl = this.gitlabInstance.baseUrl.endsWith('/') 
      ? this.gitlabInstance.baseUrl.slice(0, -1) 
      : this.gitlabInstance.baseUrl;
    return `${baseUrl}/${this.gitlabUsername}`;
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
    return `${baseUrl}/api/v4/users/${this.gitlabUserId}${endpoint}`;
  }

  /**
   * 验证映射配置是否完整
   */
  isValid(): boolean {
    return !!(this.userId && this.gitlabInstanceId && this.gitlabUserId && this.gitlabUsername);
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    return `${this.user?.name || 'Unknown User'} (@${this.gitlabUsername})`;
  }

  /**
   * 更新GitLab用户信息
   */
  updateGitLabUser(gitlabUserId: number, gitlabUsername: string): void {
    this.gitlabUserId = gitlabUserId;
    this.gitlabUsername = gitlabUsername;
  }
}
