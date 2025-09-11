import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('attachments')
@Index(['issueId', 'createdAt'])
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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


