import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('memberships')
@Index(['projectId', 'userId'], { unique: true })
export class MembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ length: 32 })
  role!: string; // member | project_manager

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  joinedAt!: Date;
}


