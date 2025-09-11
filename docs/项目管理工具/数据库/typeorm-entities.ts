// TypeORM entities for MySQL 8 (initial draft)
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ length: 512, nullable: true })
  avatar?: string;

  @Column({ default: 'active' })
  status!: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;
}

@Entity('projects')
@Index(['key'], { unique: true })
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  orgId?: string;

  @Column({ type: 'varchar', length: 20 })
  key!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ default: 'private' })
  visibility!: string;

  @Column({ default: false })
  archived!: boolean;

  @Column()
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => MembershipEntity, (m) => m.project)
  members!: MembershipEntity[];
}

@Entity('memberships')
@Index(['projectId', 'userId'], { unique: true })
export class MembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  joinedAt!: Date;
}

export enum IssueType {
  requirement = 'requirement',
  task = 'task',
  bug = 'bug'
}

@Entity('issues')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
export class IssueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'project_id' })
  projectId!: string;

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

  @Column({ name: 'reporter_id' })
  reporterId!: string;

  @Column({ name: 'story_points', nullable: true, type: 'int' })
  storyPoints?: number;

  @Column({ name: 'estimate_minutes', nullable: true, type: 'int' })
  estimateMinutes?: number;

  @Column({ name: 'remaining_minutes', nullable: true, type: 'int' })
  remainingMinutes?: number;

  @Column({ name: 'sprint_id', nullable: true })
  sprintId?: string;

  @Column({ name: 'release_id', nullable: true })
  releaseId?: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @Column({ type: 'json' })
  labels!: string[];

  @Column({ name: 'due_at', type: 'timestamp', precision: 6, nullable: true })
  dueAt?: Date;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;

  @Column({ default: false })
  deleted!: boolean;
}

@Entity('comments')
@Index(['issueId', 'createdAt'])
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => IssueEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue!: IssueEntity;

  @Column({ name: 'issue_id' })
  issueId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: UserEntity;

  @Column({ name: 'author_id' })
  authorId!: string;

  @Column({ type: 'mediumtext' })
  body!: string;

  @Column({ type: 'json', nullable: true })
  mentions?: string[];

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;
}

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => IssueEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue!: IssueEntity;

  @Column({ name: 'issue_id' })
  issueId!: string;

  @Column({ name: 'object_key', length: 255 })
  objectKey!: string;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column()
  size!: number;

  @Column({ name: 'content_type', length: 128 })
  contentType!: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;
}

@Entity('sprints')
@Index(['projectId', 'startAt', 'endAt'])
export class SprintEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column()
  name!: string;

  @Column({ name: 'start_at', type: 'timestamp', precision: 6, nullable: true })
  startAt?: Date;

  @Column({ name: 'end_at', type: 'timestamp', precision: 6, nullable: true })
  endAt?: Date;

  @Column({ nullable: true, length: 255 })
  goal?: string;

  @Column({ nullable: true, type: 'int' })
  capacity?: number;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;
}

@Entity('releases')
@Index(['projectId', 'releasedAt'])
export class ReleaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column()
  name!: string;

  @Column()
  tag!: string;

  @Column({ type: 'mediumtext', nullable: true })
  notes?: string;

  @Column({ name: 'released_at', type: 'timestamp', precision: 6, nullable: true })
  releasedAt?: Date;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;
}


