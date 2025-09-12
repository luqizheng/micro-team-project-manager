import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardEntity } from './board.entity';
import { BoardColumnEntity } from './board-column.entity';
import { IssueEntity } from '../issues/issue.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepo: Repository<BoardEntity>,
    @InjectRepository(BoardColumnEntity)
    private readonly columnRepo: Repository<BoardColumnEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
  ) {}

  async findByProject(projectId: string) {
    return this.boardRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' }
    });
  }

  async findOne(id: string) {
    return this.boardRepo.findOne({ where: { id } });
  }

  async findWithColumns(id: string) {
    return this.boardRepo.findOne({
      where: { id },
      relations: ['columns'],
      order: { columns: { sortOrder: 'ASC' } }
    });
  }

  async create(data: {
    projectId: string;
    name: string;
    description?: string;
    isDefault?: boolean;
  }) {
    const board = this.boardRepo.create({
      id: this.generateId(),
      ...data
    });
    return this.boardRepo.save(board);
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    isDefault?: boolean;
  }) {
    const board = await this.findOne(id);
    if (!board) {
      throw new Error('看板不存在');
    }

    Object.assign(board, data);
    return this.boardRepo.save(board);
  }

  async delete(id: string) {
    const board = await this.findOne(id);
    if (!board) {
      throw new Error('看板不存在');
    }

    // 删除看板列
    await this.columnRepo.delete({ boardId: id });
    
    // 删除看板
    return this.boardRepo.delete(id);
  }

  async createDefaultBoard(projectId: string) {
    // 创建默认看板
    const board = await this.create({
      projectId,
      name: '默认看板',
      description: '项目的默认看板',
      isDefault: true
    });

    // 创建默认列
    const defaultColumns = [
      { name: '待办', stateMapping: 'todo', color: '#faad14', sortOrder: 0 },
      { name: '进行中', stateMapping: 'in_progress', color: '#1890ff', sortOrder: 1 },
      { name: '测试中', stateMapping: 'testing', color: '#722ed1', sortOrder: 2 },
      { name: '已完成', stateMapping: 'done', color: '#52c41a', sortOrder: 3 },
    ];

    for (const columnData of defaultColumns) {
      await this.createColumn({
        boardId: board.id,
        ...columnData
      });
    }

    return board;
  }

  // 列管理方法
  async createColumn(data: {
    boardId: string;
    name: string;
    description?: string;
    wipLimit?: number;
    sortOrder?: number;
    stateMapping: string;
    color?: string;
  }) {
    const column = this.columnRepo.create({
      id: this.generateId(),
      ...data,
      color: data.color || '#1890ff',
      sortOrder: data.sortOrder || 0
    });
    return this.columnRepo.save(column);
  }

  async updateColumn(id: string, data: {
    name?: string;
    description?: string;
    wipLimit?: number;
    sortOrder?: number;
    stateMapping?: string;
    color?: string;
  }) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) {
      throw new Error('看板列不存在');
    }

    Object.assign(column, data);
    return this.columnRepo.save(column);
  }

  async deleteColumn(id: string) {
    const column = await this.columnRepo.findOne({ where: { id } });
    if (!column) {
      throw new Error('看板列不存在');
    }

    return this.columnRepo.delete(id);
  }

  async reorderColumns(boardId: string, columnIds: string[]) {
    for (let i = 0; i < columnIds.length; i++) {
      await this.columnRepo.update(
        { id: columnIds[i] },
        { sortOrder: i }
      );
    }
  }

  async getBoardWithIssues(boardId: string, projectId: string) {
    const board = await this.findWithColumns(boardId);
    if (!board) {
      throw new Error('看板不存在');
    }

    // 获取所有事项
    const issues = await this.issueRepo.find({
      where: { projectId, deleted: false },
      order: { updatedAt: 'DESC' }
    });

    // 按列分组事项
    const columnsWithIssues = board.columns.map(column => ({
      ...column,
      issues: issues.filter(issue => issue.state === column.stateMapping)
    }));

    return {
      ...board,
      columns: columnsWithIssues
    };
  }

  async moveIssueToColumn(issueId: string, columnId: string) {
    const column = await this.columnRepo.findOne({ where: { id: columnId } });
    if (!column) {
      throw new Error('看板列不存在');
    }

    const issue = await this.issueRepo.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new Error('事项不存在');
    }

    // 更新事项状态
    issue.state = column.stateMapping;
    return this.issueRepo.save(issue);
  }

  private generateId(): string {
    return 'cuid_' + Math.random().toString(36).substr(2, 9);
  }
}
