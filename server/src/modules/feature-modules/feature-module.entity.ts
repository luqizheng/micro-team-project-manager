import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  Index, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { RequirementEntity } from '../requirements/requirement.entity';
import { WorkItemEntity } from '../work-items/work-item.entity';
import { ProjectEntity } from '../projects/project.entity';

/**
 * 功能模块实体
 * 独立的功能组件，包含多个相关任务
 */
@Entity('feature_modules')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'title'])
@Index(['requirementId'])
export class FeatureModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'requirement_id', nullable: true })
  requirementId?: string;

  

  @Column({ type: 'varchar', length: 140 })
  title!: string;

  @Column({ type: 'mediumtext', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 32 })
  state!: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ type: 'json', nullable: true })
  labels?: string[];

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;

  @Column({ default: false })
  deleted!: boolean;

  // 关系
  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'projectId' })
  project?: ProjectEntity;

  @ManyToOne(() => RequirementEntity, requirement => requirement.featureModules)
  @JoinColumn({ name: 'requirementId' })
  requirement?: RequirementEntity;

  

  @OneToMany(() => WorkItemEntity, wi => wi.featureModule)
  tasks?: WorkItemEntity[];

  @OneToMany(() => WorkItemEntity, wi => wi.featureModule)
  bugs?: WorkItemEntity[];
}
