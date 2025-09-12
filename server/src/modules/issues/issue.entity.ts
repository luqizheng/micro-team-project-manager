import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum IssueType {
  requirement = 'requirement',
  task = 'task',
  bug = 'bug',
}

@Entity('issues')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'key'], { unique: true })
export class IssueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  key!: string;

  @Column({ type: 'enum', enum: IssueType })
  type!: IssueType;

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
}


