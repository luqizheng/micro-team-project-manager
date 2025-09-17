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
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { ProjectEntity } from '../projects/project.entity';

/**
 * 缺陷实体
 * 系统中发现的问题或错误
 */
@Entity('bugs')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'title'])
@Index(['subsystemId'])
@Index(['featureModuleId'])
export class BugEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

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

  @Column({ type: 'varchar', length: 16, nullable: true })
  severity?: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'reporter_id', nullable: true })
  reporterId?: string;

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

  @ManyToOne(() => SubsystemEntity, subsystem => subsystem.bugs)
  @JoinColumn({ name: 'subsystemId' })
  subsystem?: SubsystemEntity;

  @ManyToOne(() => FeatureModuleEntity, featureModule => featureModule.bugs)
  @JoinColumn({ name: 'featureModuleId' })
  featureModule?: FeatureModuleEntity;
}
