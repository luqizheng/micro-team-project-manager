import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  Index, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { GitLabInstance } from './gitlab-instance.entity';

/**
 * GitLab Epic映射实体
 * 用于建立PM系统实体与GitLab Epic的映射关系
 */
@Entity('gitlab_epic_mappings')
@Index(['projectId', 'entityType', 'entityId'])
@Index(['gitlabInstanceId', 'gitlabGroupId', 'gitlabEpicId'])
@Index('unique_epic_mapping', ['projectId', 'entityType', 'entityId'], { unique: true })
export class GitLabEpicMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * PM系统项目ID
   */
  @Column({ type: 'varchar', length: 36, comment: 'PM系统项目ID' })
  projectId!: string;

  /**
   * GitLab实例ID
   */
  @Column({ type: 'varchar', length: 36, comment: 'GitLab实例ID' })
  gitlabInstanceId!: string;

  /**
   * GitLab Group ID
   */
  @Column({ type: 'int', comment: 'GitLab Group ID' })
  gitlabGroupId!: number;

  /**
   * GitLab Epic ID
   */
  @Column({ type: 'int', comment: 'GitLab Epic ID' })
  gitlabEpicId!: number;

  /**
   * 实体类型
   */
  @Column({ 
    type: 'enum', 
    enum: ['requirement', 'subsystem', 'feature_module'],
    comment: '实体类型'
  })
  entityType!: 'requirement' | 'subsystem' | 'feature_module';

  /**
   * 实体ID
   */
  @Column({ type: 'varchar', length: 36, comment: '实体ID' })
  entityId!: string;

  /**
   * 是否激活
   */
  @Column({ type: 'boolean', default: true, comment: '是否激活' })
  isActive!: boolean;

  /**
   * 最后同步时间
   */
  @Column({ type: 'timestamp', nullable: true, comment: '最后同步时间' })
  lastSyncAt?: Date;

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;

  /**
   * GitLab实例关系
   */
  @ManyToOne(() => GitLabInstance)
  @JoinColumn({ name: 'gitlabInstanceId' })
  gitlabInstance?: GitLabInstance;
}
