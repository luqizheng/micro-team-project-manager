import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementEntity } from '../requirements/requirement.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { TaskEntity } from '../tasks/task.entity';
import { BugEntity } from '../bugs/bug.entity';

export type EntityType = 'requirement' | 'subsystem' | 'feature_module' | 'task' | 'bug';

export interface MoveEntityDto {
  entityType: EntityType;
  entityId: string;
  newParentType?: 'requirement' | 'subsystem' | 'feature_module';
  newParentId?: string;
}

export interface HierarchyNode {
  id: string;
  type: EntityType;
  title: string;
  state: string;
  children?: HierarchyNode[];
}

@Injectable()
export class HierarchyService {
  private readonly logger = new Logger(HierarchyService.name);

  constructor(
    @InjectRepository(RequirementEntity)
    private readonly requirementRepo: Repository<RequirementEntity>,
    @InjectRepository(SubsystemEntity)
    private readonly subsystemRepo: Repository<SubsystemEntity>,
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepo: Repository<FeatureModuleEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(BugEntity)
    private readonly bugRepo: Repository<BugEntity>,
  ) {}

  /**
   * 获取项目的完整层级结构
   */
  async getHierarchy(projectId: string) {
    // 获取所有需求
    const requirements = await this.requirementRepo.find({
      where: { projectId, deleted: false },
      relations: ['subsystems', 'featureModules', 'tasks'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有子系统
    const subsystems = await this.subsystemRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'featureModules', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有功能模块
    const featureModules = await this.featureModuleRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'subsystem', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有任务
    const tasks = await this.taskRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'subsystem', 'featureModule', 'parent', 'children'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有缺陷
    const bugs = await this.bugRepo.find({
      where: { projectId, deleted: false },
      relations: ['subsystem', 'featureModule'],
      order: { createdAt: 'ASC' },
    });

    return {
      requirements: this.buildRequirementNodes(requirements),
      subsystems: this.buildSubsystemNodes(subsystems),
      featureModules: this.buildFeatureModuleNodes(featureModules),
      tasks: this.buildTaskNodes(tasks),
      bugs: this.buildBugNodes(bugs),
    };
  }

  /**
   * 移动实体到新的父级
   */
  async moveEntity(dto: MoveEntityDto): Promise<void> {
    const { entityType, entityId, newParentType, newParentId } = dto;

    // 验证实体存在
    const entity = await this.findEntity(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(`${entityType}不存在`);
    }

    // 验证新的父级存在（如果指定了）
    if (newParentType && newParentId) {
      const parent = await this.findEntity(newParentType, newParentId);
      if (!parent) {
        throw new NotFoundException(`${newParentType}不存在`);
      }

      // 验证层级关系是否合法
      this.validateHierarchyRelation(entityType, newParentType);
    }

    // 执行移动操作
    await this.performMove(entityType, entityId, newParentType, newParentId);

    this.logger.log(`移动${entityType}成功: ${entityId} -> ${newParentType}:${newParentId}`);
  }

  /**
   * 获取实体的子项
   */
  async getChildren(entityType: EntityType, entityId: string): Promise<HierarchyNode[]> {
    const entity = await this.findEntity(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(`${entityType}不存在`);
    }

    switch (entityType) {
      case 'requirement':
        return this.getRequirementChildren(entityId);
      case 'subsystem':
        return this.getSubsystemChildren(entityId);
      case 'feature_module':
        return this.getFeatureModuleChildren(entityId);
      case 'task':
        return this.getTaskChildren(entityId);
      default:
        return [];
    }
  }

  /**
   * 获取实体的父级
   */
  async getParents(entityType: EntityType, entityId: string): Promise<HierarchyNode[]> {
    const entity = await this.findEntity(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(`${entityType}不存在`);
    }

    const parents: HierarchyNode[] = [];

    // 根据实体类型获取父级
    switch (entityType) {
      case 'subsystem':
        const subsystem = entity as SubsystemEntity;
        if (subsystem.requirementId) {
          const requirement = await this.requirementRepo.findOne({
            where: { id: subsystem.requirementId, deleted: false },
          });
          if (requirement) {
            parents.push({
              id: requirement.id,
              type: 'requirement',
              title: requirement.title,
              state: requirement.state,
            });
          }
        }
        break;
      case 'feature_module':
        const featureModule = entity as FeatureModuleEntity;
        if (featureModule.requirementId) {
          const requirement = await this.requirementRepo.findOne({
            where: { id: featureModule.requirementId, deleted: false },
          });
          if (requirement) {
            parents.push({
              id: requirement.id,
              type: 'requirement',
              title: requirement.title,
              state: requirement.state,
            });
          }
        }
        if (featureModule.subsystemId) {
          const subsystem = await this.subsystemRepo.findOne({
            where: { id: featureModule.subsystemId, deleted: false },
          });
          if (subsystem) {
            parents.push({
              id: subsystem.id,
              type: 'subsystem',
              title: subsystem.title,
              state: subsystem.state,
            });
          }
        }
        break;
      case 'task':
        const task = entity as TaskEntity;
        if (task.requirementId) {
          const requirement = await this.requirementRepo.findOne({
            where: { id: task.requirementId, deleted: false },
          });
          if (requirement) {
            parents.push({
              id: requirement.id,
              type: 'requirement',
              title: requirement.title,
              state: requirement.state,
            });
          }
        }
        if (task.subsystemId) {
          const subsystem = await this.subsystemRepo.findOne({
            where: { id: task.subsystemId, deleted: false },
          });
          if (subsystem) {
            parents.push({
              id: subsystem.id,
              type: 'subsystem',
              title: subsystem.title,
              state: subsystem.state,
            });
          }
        }
        if (task.featureModuleId) {
          const featureModule = await this.featureModuleRepo.findOne({
            where: { id: task.featureModuleId, deleted: false },
          });
          if (featureModule) {
            parents.push({
              id: featureModule.id,
              type: 'feature_module',
              title: featureModule.title,
              state: featureModule.state,
            });
          }
        }
        if (task.parentId) {
          const parentTask = await this.taskRepo.findOne({
            where: { id: task.parentId, deleted: false },
          });
          if (parentTask) {
            parents.push({
              id: parentTask.id,
              type: 'task',
              title: parentTask.title,
              state: parentTask.state,
            });
          }
        }
        break;
      case 'bug':
        const bug = entity as BugEntity;
        if (bug.subsystemId) {
          const subsystem = await this.subsystemRepo.findOne({
            where: { id: bug.subsystemId, deleted: false },
          });
          if (subsystem) {
            parents.push({
              id: subsystem.id,
              type: 'subsystem',
              title: subsystem.title,
              state: subsystem.state,
            });
          }
        }
        if (bug.featureModuleId) {
          const featureModule = await this.featureModuleRepo.findOne({
            where: { id: bug.featureModuleId, deleted: false },
          });
          if (featureModule) {
            parents.push({
              id: featureModule.id,
              type: 'feature_module',
              title: featureModule.title,
              state: featureModule.state,
            });
          }
        }
        break;
    }

    return parents;
  }

  private async findEntity(entityType: EntityType, entityId: string) {
    switch (entityType) {
      case 'requirement':
        return this.requirementRepo.findOne({ where: { id: entityId, deleted: false } });
      case 'subsystem':
        return this.subsystemRepo.findOne({ where: { id: entityId, deleted: false } });
      case 'feature_module':
        return this.featureModuleRepo.findOne({ where: { id: entityId, deleted: false } });
      case 'task':
        return this.taskRepo.findOne({ where: { id: entityId, deleted: false } });
      case 'bug':
        return this.bugRepo.findOne({ where: { id: entityId, deleted: false } });
      default:
        return null;
    }
  }

  private validateHierarchyRelation(entityType: EntityType, parentType: string) {
    const validRelations: Record<EntityType, string[]> = {
      'requirement': [],
      'subsystem': ['requirement'],
      'feature_module': ['requirement', 'subsystem'],
      'task': ['requirement', 'subsystem', 'feature_module', 'task'],
      'bug': ['subsystem', 'feature_module'],
    };

    const validParents = validRelations[entityType];
    if (!validParents || !validParents.includes(parentType)) {
      throw new BadRequestException(`无效的层级关系: ${entityType} 不能属于 ${parentType}`);
    }
  }

  private async performMove(entityType: EntityType, entityId: string, newParentType?: string, newParentId?: string) {
    switch (entityType) {
      case 'subsystem':
        await this.subsystemRepo.update(entityId, { requirementId: newParentId || undefined });
        break;
      case 'feature_module':
        if (newParentType === 'requirement') {
          await this.featureModuleRepo.update(entityId, { 
            requirementId: newParentId,
            subsystemId: undefined
          });
        } else if (newParentType === 'subsystem') {
          await this.featureModuleRepo.update(entityId, { 
            subsystemId: newParentId,
            requirementId: undefined
          });
        }
        break;
      case 'task':
        if (newParentType === 'requirement') {
          await this.taskRepo.update(entityId, { 
            requirementId: newParentId,
            subsystemId: undefined,
            featureModuleId: undefined,
            parentId: undefined
          });
        } else if (newParentType === 'subsystem') {
          await this.taskRepo.update(entityId, { 
            subsystemId: newParentId,
            requirementId: undefined,
            featureModuleId: undefined,
            parentId: undefined
          });
        } else if (newParentType === 'feature_module') {
          await this.taskRepo.update(entityId, { 
            featureModuleId: newParentId,
            requirementId: undefined,
            subsystemId: undefined,
            parentId: undefined
          });
        } else if (newParentType === 'task') {
          await this.taskRepo.update(entityId, { 
            parentId: newParentId,
            requirementId: undefined,
            subsystemId: undefined,
            featureModuleId: undefined
          });
        }
        break;
      case 'bug':
        if (newParentType === 'subsystem') {
          await this.bugRepo.update(entityId, { 
            subsystemId: newParentId,
            featureModuleId: undefined
          });
        } else if (newParentType === 'feature_module') {
          await this.bugRepo.update(entityId, { 
            featureModuleId: newParentId,
            subsystemId: undefined
          });
        }
        break;
    }
  }

  private buildRequirementNodes(requirements: RequirementEntity[]): HierarchyNode[] {
    return requirements.map(req => ({
      id: req.id,
      type: 'requirement' as EntityType,
      title: req.title,
      state: req.state,
      children: [
        ...(req.subsystems || []).map(sub => ({
          id: sub.id,
          type: 'subsystem' as EntityType,
          title: sub.title,
          state: sub.state,
        })),
        ...(req.featureModules || []).map(fm => ({
          id: fm.id,
          type: 'feature_module' as EntityType,
          title: fm.title,
          state: fm.state,
        })),
        ...(req.tasks || []).map(task => ({
          id: task.id,
          type: 'task' as EntityType,
          title: task.title,
          state: task.state,
        })),
      ],
    }));
  }

  private buildSubsystemNodes(subsystems: SubsystemEntity[]): HierarchyNode[] {
    return subsystems.map(sub => ({
      id: sub.id,
      type: 'subsystem' as EntityType,
      title: sub.title,
      state: sub.state,
      children: [
        ...(sub.featureModules || []).map(fm => ({
          id: fm.id,
          type: 'feature_module' as EntityType,
          title: fm.title,
          state: fm.state,
        })),
        ...(sub.tasks || []).map(task => ({
          id: task.id,
          type: 'task' as EntityType,
          title: task.title,
          state: task.state,
        })),
        ...(sub.bugs || []).map(bug => ({
          id: bug.id,
          type: 'bug' as EntityType,
          title: bug.title,
          state: bug.state,
        })),
      ],
    }));
  }

  private buildFeatureModuleNodes(featureModules: FeatureModuleEntity[]): HierarchyNode[] {
    return featureModules.map(fm => ({
      id: fm.id,
      type: 'feature_module' as EntityType,
      title: fm.title,
      state: fm.state,
      children: [
        ...(fm.tasks || []).map(task => ({
          id: task.id,
          type: 'task' as EntityType,
          title: task.title,
          state: task.state,
        })),
        ...(fm.bugs || []).map(bug => ({
          id: bug.id,
          type: 'bug' as EntityType,
          title: bug.title,
          state: bug.state,
        })),
      ],
    }));
  }

  private buildTaskNodes(tasks: TaskEntity[]): HierarchyNode[] {
    return tasks.map(task => ({
      id: task.id,
      type: 'task' as EntityType,
      title: task.title,
      state: task.state,
      children: (task.children || []).map(child => ({
        id: child.id,
        type: 'task' as EntityType,
        title: child.title,
        state: child.state,
      })),
    }));
  }

  private buildBugNodes(bugs: BugEntity[]): HierarchyNode[] {
    return bugs.map(bug => ({
      id: bug.id,
      type: 'bug' as EntityType,
      title: bug.title,
      state: bug.state,
    }));
  }

  private async getRequirementChildren(requirementId: string): Promise<HierarchyNode[]> {
    const [subsystems, featureModules, tasks] = await Promise.all([
      this.subsystemRepo.find({ where: { requirementId, deleted: false } }),
      this.featureModuleRepo.find({ where: { requirementId, deleted: false } }),
      this.taskRepo.find({ where: { requirementId, deleted: false } }),
    ]);

    return [
      ...subsystems.map(sub => ({ id: sub.id, type: 'subsystem' as EntityType, title: sub.title, state: sub.state })),
      ...featureModules.map(fm => ({ id: fm.id, type: 'feature_module' as EntityType, title: fm.title, state: fm.state })),
      ...tasks.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state })),
    ];
  }

  private async getSubsystemChildren(subsystemId: string): Promise<HierarchyNode[]> {
    const [featureModules, tasks, bugs] = await Promise.all([
      this.featureModuleRepo.find({ where: { subsystemId, deleted: false } }),
      this.taskRepo.find({ where: { subsystemId, deleted: false } }),
      this.bugRepo.find({ where: { subsystemId, deleted: false } }),
    ]);

    return [
      ...featureModules.map(fm => ({ id: fm.id, type: 'feature_module' as EntityType, title: fm.title, state: fm.state })),
      ...tasks.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state })),
      ...bugs.map(bug => ({ id: bug.id, type: 'bug' as EntityType, title: bug.title, state: bug.state })),
    ];
  }

  private async getFeatureModuleChildren(featureModuleId: string): Promise<HierarchyNode[]> {
    const [tasks, bugs] = await Promise.all([
      this.taskRepo.find({ where: { featureModuleId, deleted: false } }),
      this.bugRepo.find({ where: { featureModuleId, deleted: false } }),
    ]);

    return [
      ...tasks.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state })),
      ...bugs.map(bug => ({ id: bug.id, type: 'bug' as EntityType, title: bug.title, state: bug.state })),
    ];
  }

  private async getTaskChildren(taskId: string): Promise<HierarchyNode[]> {
    const children = await this.taskRepo.find({ where: { parentId: taskId, deleted: false } });
    return children.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state }));
  }
}