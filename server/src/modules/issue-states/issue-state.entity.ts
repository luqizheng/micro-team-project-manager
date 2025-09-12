import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum IssueType {
  requirement = 'requirement',
  task = 'task',
  bug = 'bug',
}

@Entity('project_issue_states')
@Index(['projectId', 'issueType'])
export class IssueStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'issue_type', type: 'enum', enum: IssueType })
  issueType!: IssueType;

  @Column({ name: 'state_key', type: 'varchar', length: 32 })
  stateKey!: string;

  @Column({ name: 'state_name', type: 'varchar', length: 64 })
  stateName!: string;

  @Column({ type: 'varchar', length: 16, default: '#1890ff' })
  color!: string;

  @Column({ name: 'is_initial', type: 'boolean', default: false })
  isInitial!: boolean;

  @Column({ name: 'is_final', type: 'boolean', default: false })
  isFinal!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 6 })
  updatedAt!: Date;
}
