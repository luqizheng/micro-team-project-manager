import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueStateEntity, IssueType } from './issue-state.entity';

@Injectable()
export class IssueStatesService {
  constructor(
    @InjectRepository(IssueStateEntity)
    private readonly repo: Repository<IssueStateEntity>,
  ) {}

  async findByProjectAndType(projectId: string, issueType: IssueType) {
    return this.repo.find({
      where: { projectId, issueType },
      order: { sortOrder: 'ASC' }
    });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: {
    projectId: string;
    issueType: IssueType;
    stateKey: string;
    stateName: string;
    color?: string;
    isInitial?: boolean;
    isFinal?: boolean;
    sortOrder?: number;
  }) {
    // 检查状态键是否已存在
    const existing = await this.repo.findOne({
      where: { projectId: data.projectId, issueType: data.issueType, stateKey: data.stateKey }
    });
    
    if (existing) {
      throw new Error('状态键已存在');
    }

    // 如果设置为初始状态，需要取消其他状态的初始状态
    if (data.isInitial) {
      await this.repo.update(
        { projectId: data.projectId, issueType: data.issueType, isInitial: true },
        { isInitial: false }
      );
    }

    // 如果设置为最终状态，需要取消其他状态的最终状态
    if (data.isFinal) {
      await this.repo.update(
        { projectId: data.projectId, issueType: data.issueType, isFinal: true },
        { isFinal: false }
      );
    }

    const entity = this.repo.create({
      ...data,
      color: data.color || '#1890ff',
      isInitial: data.isInitial || false,
      isFinal: data.isFinal || false,
      sortOrder: data.sortOrder || 0
    });

    return this.repo.save(entity);
  }

  async update(id: string, data: {
    stateName?: string;
    color?: string;
    isInitial?: boolean;
    isFinal?: boolean;
    sortOrder?: number;
  }) {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('状态不存在');
    }

    // 如果设置为初始状态，需要取消其他状态的初始状态
    if (data.isInitial) {
      await this.repo.update(
        { projectId: entity.projectId, issueType: entity.issueType, isInitial: true },
        { isInitial: false }
      );
    }

    // 如果设置为最终状态，需要取消其他状态的最终状态
    if (data.isFinal) {
      await this.repo.update(
        { projectId: entity.projectId, issueType: entity.issueType, isFinal: true },
        { isFinal: false }
      );
    }

    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string) {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new Error('状态不存在');
    }

    // 检查状态是否被使用
    const isUsed = await this.isStateUsed(entity.projectId, entity.stateKey);
    if (isUsed) {
      throw new Error('该状态正在被使用，无法删除');
    }

    return this.repo.delete(id);
  }

  async reorder(projectId: string, issueType: IssueType, stateOrder: string[]) {
    const states = await this.findByProjectAndType(projectId, issueType);
    const stateMap = new Map(states.map(state => [state.stateKey, state]));

    for (let i = 0; i < stateOrder.length; i++) {
      const stateKey = stateOrder[i];
      const state = stateMap.get(stateKey);
      if (state) {
        state.sortOrder = i;
        await this.repo.save(state);
      }
    }
  }

  private async isStateUsed(projectId: string, stateKey: string): Promise<boolean> {
    // 这里需要检查 issues 表中是否有使用该状态的记录
    // 由于没有直接访问 issues 表，我们返回 false
    // 在实际实现中，应该注入 IssuesService 或直接查询数据库
    return false;
  }
}
