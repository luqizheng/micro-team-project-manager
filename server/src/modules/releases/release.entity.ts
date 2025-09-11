import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('releases')
@Index(['projectId', 'releasedAt'])
export class ReleaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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


