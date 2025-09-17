import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementEntity } from '../requirements/requirement.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';

/**
 * 统一工作项实体（合并 Task 与 Bug）
 * 通过 type 字段区分类别：task | bug
 */
@Entity('work_items')
@Index(['projectId', 'type', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'title'])
@Index(['requirementId'])
@Index(['subsystemId'])
@Index(['featureModuleId'])
@Index(['parentId'])
export class WorkItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 16 })
  type!: 'task' | 'bug';

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'requirement_id', nullable: true })
  requirementId?: string;

  @Column({ name: 'subsystem_id', nullable: true })
  subsystemId?: string;

  @Column({ name: 'feature_module_id', nullable: true })
  featureModuleId?: string;

  @Column({ type: 'varchar', length: 140 })
  title!: string;

  @Column({ type: 'mediumtext', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 32 })
  state!: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  priority?: string;

  // bug 专属字段（可选）
  @Column({ type: 'varchar', length: 16, nullable: true })
  severity?: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'reporter_id', nullable: true })
  reporterId?: string;

  // task 常见扩展字段（可选）
  @Column({ name: 'story_points', type: 'int', nullable: true })
  storyPoints?: number;

  @Column({ name: 'estimate_minutes', type: 'int', nullable: true })
  estimateMinutes?: number;

  @Column({ name: 'remaining_minutes', type: 'int', nullable: true })
  remainingMinutes?: number;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: {
    to: (value?: number) => value,
    from: (value?: string) => (value == null ? null : parseFloat(value)),
  } })
  estimatedHours?: number | null;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 5, scale: 1, nullable: true, transformer: {
    to: (value?: number) => value,
    from: (value?: string) => (value == null ? null : parseFloat(value)),
  } })
  actualHours?: number | null;

  @Column({ name: 'sprint_id', nullable: true })
  sprintId?: string;

  @Column({ name: 'release_id', nullable: true })
  releaseId?: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @Column({ type: 'json', nullable: true })
  labels?: string[];

  @Column({ name: 'due_at', type: 'timestamp', precision: 6, nullable: true })
  dueAt?: Date;

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

  @ManyToOne(() => RequirementEntity, requirement => requirement.tasks)
  @JoinColumn({ name: 'requirementId' })
  requirement?: RequirementEntity;

  @ManyToOne(() => SubsystemEntity, subsystem => subsystem.tasks)
  @JoinColumn({ name: 'subsystemId' })
  subsystem?: SubsystemEntity;

  @ManyToOne(() => FeatureModuleEntity, featureModule => featureModule.tasks)
  @JoinColumn({ name: 'featureModuleId' })
  featureModule?: FeatureModuleEntity;

  @ManyToOne(() => WorkItemEntity, wi => wi.children)
  @JoinColumn({ name: 'parentId' })
  parent?: WorkItemEntity;

  @OneToMany(() => WorkItemEntity, wi => wi.parent)
  children?: WorkItemEntity[];
}


