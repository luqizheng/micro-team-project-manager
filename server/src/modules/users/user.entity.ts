import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 160 })
  email!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ name: 'display_name', length: 120, nullable: true })
  displayName?: string;

  @Column({ length: 255, nullable: true })
  avatar?: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 'active' })
  status!: string;

  @Column({ type: 'json', nullable: true })
  systemRoles?: string[];

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updatedAt!: Date;
}


