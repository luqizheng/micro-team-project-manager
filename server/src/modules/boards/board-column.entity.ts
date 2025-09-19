import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BoardEntity } from './board.entity';

@Entity('board_columns')
@Index(['boardId'])
export class BoardColumnEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ name: 'board_id' })
  boardId!: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'wip_limit', type: 'int', nullable: true })
  wipLimit?: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'state_mapping', type: 'varchar', length: 128 })
  stateMapping!: string; // 映射到事项状态的�?

  @Column({ name: 'color', type: 'varchar', length: 16, default: '#1890ff' })
  color!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 6 })
  updatedAt!: Date;

  @ManyToOne(() => BoardEntity, board => board.columns)
  @JoinColumn({ name: 'board_id' })
  board!: BoardEntity;
}
