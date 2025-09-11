import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sprints')
@Index(['projectId', 'startAt', 'endAt'])
export class SprintEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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


