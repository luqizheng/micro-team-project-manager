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

  /**
   * 为项目初始化默认的issues状态
   * @param projectId 项目ID
   */
  async initializeDefaultStates(projectId: string): Promise<void> {
    const defaultStates = {
      requirement: [
        { key: 'draft', name: '草稿', color: '#d9d9d9', isInitial: true, sortOrder: 0 },
        { key: 'pending_review', name: '待评审', color: '#faad14', isInitial: false, sortOrder: 1 },
        { key: 'reviewing', name: '评审中', color: '#1890ff', isInitial: false, sortOrder: 2 },
        { key: 'approved', name: '已通过', color: '#52c41a', isInitial: false, sortOrder: 3 },
        { key: 'in_development', name: '开发中', color: '#722ed1', isInitial: false, sortOrder: 4 },
        { key: 'completed', name: '已完成', color: '#13c2c2', isInitial: false, sortOrder: 5 },
        { key: 'closed', name: '已关闭', color: '#8c8c8c', isInitial: false, isFinal: true, sortOrder: 6 }
      ],
      task: [
        { key: 'todo', name: '待办', color: '#d9d9d9', isInitial: true, sortOrder: 0 },
        { key: 'in_progress', name: '进行中', color: '#1890ff', isInitial: false, sortOrder: 1 },
        { key: 'done', name: '已完成', color: '#52c41a', isInitial: false, sortOrder: 2 },
        { key: 'closed', name: '已关闭', color: '#8c8c8c', isInitial: false, isFinal: true, sortOrder: 3 }
      ],
      bug: [
        { key: 'new', name: '新建', color: '#d9d9d9', isInitial: true, sortOrder: 0 },
        { key: 'confirmed', name: '已确认', color: '#faad14', isInitial: false, sortOrder: 1 },
        { key: 'fixing', name: '修复中', color: '#1890ff', isInitial: false, sortOrder: 2 },
        { key: 'testing', name: '待测试', color: '#722ed1', isInitial: false, sortOrder: 3 },
        { key: 'fixed', name: '已修复', color: '#52c41a', isInitial: false, sortOrder: 4 },
        { key: 'closed', name: '已关闭', color: '#8c8c8c', isInitial: false, isFinal: true, sortOrder: 5 }
      ]
    };

    // 检查是否已经初始化过
    const existingStates = await this.repo.find({
      where: { projectId },
      select: ['issueType']
    });
    
    if (existingStates.length > 0) {
      console.log(`Project ${projectId} already has issue states initialized`);
      return;
    }

    // 为每种issue类型创建默认状态
    for (const [issueType, states] of Object.entries(defaultStates)) {
      for (const state of states) {
        try {
          await this.create({
            projectId,
            issueType: issueType as IssueType,
            stateKey: state.key,
            stateName: state.name,
            color: state.color,
            isInitial: state.isInitial || false,
            isFinal: state.isFinal || false,
            sortOrder: state.sortOrder
          });
        } catch (error) {
          console.error(`Failed to create state ${state.key} for project ${projectId}:`, error);
          // 继续创建其他状态，不因为一个状态创建失败而中断整个过程
        }
      }
    }

    console.log(`Successfully initialized default issue states for project ${projectId}`);
  }

  private async isStateUsed(projectId: string, stateKey: string): Promise<boolean> {
    // 这里需要检查 issues 表中是否有使用该状态的记录
    // 由于没有直接访问 issues 表，我们返回 false
    // 在实际实现中，应该注入 IssuesService 或直接查询数据库
    return false;
  }
}
