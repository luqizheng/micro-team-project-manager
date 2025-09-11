import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('projects')
@Index(['key'], { unique: true })
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
}


