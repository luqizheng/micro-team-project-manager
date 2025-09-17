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
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { TaskEntity } from '../tasks/task.entity';
import { ProjectEntity } from '../projects/project.entity';

/**
 * 需求实体
 * 业务或技术需求，可分解为功能模块或任务
 */
@Entity('requirements')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'title'])
export class RequirementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 140 })
  title!: string;

  @Column({ type: 'mediumtext', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 32 })
  state!: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  priority?: string;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ name: 'reporter_id', nullable: true })
  reporterId?: string;

  @Column({ name: 'story_points', type: 'int', nullable: true })
  storyPoints?: number;

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

  @OneToMany(() => SubsystemEntity, subsystem => subsystem.requirement)
  subsystems?: SubsystemEntity[];

  @OneToMany(() => FeatureModuleEntity, featureModule => featureModule.requirement)
  featureModules?: FeatureModuleEntity[];

  @OneToMany(() => TaskEntity, task => task.requirement)
  tasks?: TaskEntity[];
}
