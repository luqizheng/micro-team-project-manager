import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('comments')
@Index(['issueId', 'createdAt'])
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'issue_id' })
  issueId!: string;

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


