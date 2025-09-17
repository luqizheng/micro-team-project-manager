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
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { TaskEntity } from '../tasks/task.entity';
import { BugEntity } from '../bugs/bug.entity';
import { ProjectEntity } from '../projects/project.entity';

/**
 * 功能模块实体
 * 独立的功能组件，包含多个相关任务
 */
@Entity('feature_modules')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'title'])
@Index(['requirementId'])
@Index(['subsystemId'])
export class FeatureModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'requirement_id', nullable: true })
  requirementId?: string;

  @Column({ name: 'subsystem_id', nullable: true })
  subsystemId?: string;

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

  @ManyToOne(() => SubsystemEntity, subsystem => subsystem.featureModules)
  @JoinColumn({ name: 'subsystemId' })
  subsystem?: SubsystemEntity;

  @OneToMany(() => TaskEntity, task => task.featureModule)
  tasks?: TaskEntity[];

  @OneToMany(() => BugEntity, bug => bug.featureModule)
  bugs?: BugEntity[];
}
