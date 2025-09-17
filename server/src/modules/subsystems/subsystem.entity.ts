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
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { TaskEntity } from '../tasks/task.entity';
import { BugEntity } from '../bugs/bug.entity';
import { ProjectEntity } from '../projects/project.entity';

/**
 * 子系统实体
 * 系统的子部分，包含多个功能模块
 */
@Entity('subsystems')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'title'])
@Index(['requirementId'])
export class SubsystemEntity {
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

  @ManyToOne(() => RequirementEntity, requirement => requirement.subsystems)
  @JoinColumn({ name: 'requirementId' })
  requirement?: RequirementEntity;

  @OneToMany(() => FeatureModuleEntity, featureModule => featureModule.subsystem)
  featureModules?: FeatureModuleEntity[];

  @OneToMany(() => TaskEntity, task => task.subsystem)
  tasks?: TaskEntity[];

  @OneToMany(() => BugEntity, bug => bug.subsystem)
  bugs?: BugEntity[];
}
