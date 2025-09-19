import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementEntity } from '../requirements/requirement.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { WorkItemEntity } from '../work-items/work-item.entity';

export type EntityType = 'requirement' | 'feature_module' | 'task' | 'bug';

export interface MoveEntityDto {
  entityType: EntityType;
  entityId: string;
  newParentType?: 'requirement' | 'feature_module' | 'task';
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
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepo: Repository<FeatureModuleEntity>,
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepo: Repository<WorkItemEntity>,
  ) {}

  /**
   * 获取项目的完整层级结�?
   */
  async getHierarchy(projectId: string) {
    // 获取所有需�?
    const requirements = await this.requirementRepo.find({
      where: { projectId, deleted: false },
      relations: ['featureModules', 'tasks'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有功能模�?
    const featureModules = await this.featureModuleRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有任务（来自统一工作项）
    const tasks = await this.workItemRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'subsystem', 'featureModule', 'parent', 'children'],
      order: { createdAt: 'ASC' },
    });

    // 获取所有缺陷（来自统一工作项）
    const bugs = await this.workItemRepo.find({
      where: { projectId, deleted: false },
      relations: ['subsystem', 'featureModule'],
      order: { createdAt: 'ASC' },
    });

    return {
      requirements: this.buildRequirementNodes(requirements),
      featureModules: this.buildFeatureModuleNodes(featureModules),
      tasks: this.buildTaskNodes(tasks),
      bugs: this.buildBugNodes(bugs),
    };
  }

  /**
   * 移动实体到新的父�?
   */
  async moveEntity(dto: MoveEntityDto): Promise<void> {
    const { entityType, entityId, newParentType, newParentId } = dto;

    // 验证实体存在
    const entity = await this.findEntity(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(`${entityType}不存在`);
    }

    // 验证新的父级存在（如果指定了�?
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
   * 获取实体的子�?
   */
  async getChildren(entityType: EntityType, entityId: string): Promise<HierarchyNode[]> {
    const entity = await this.findEntity(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(`${entityType}不存在`);
    }

    switch (entityType) {
      case 'requirement':
        return this.getRequirementChildren(entityId);
      case 'feature_module':
        return this.getFeatureModuleChildren(entityId);
      case 'task':
        return this.getTaskChildren(entityId);
      default:
        return [];
    }
  }

  /**
   * 获取实体的父�?
   */
  async getParents(entityType: EntityType, entityId: string): Promise<HierarchyNode[]> {
    const entity = await this.findEntity(entityType, entityId);
    if (!entity) {
      throw new NotFoundException(`${entityType}不存在`);
    }

    const parents: HierarchyNode[] = [];

    // 根据实体类型获取父级
    switch (entityType) {
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
        break;
      case 'task':
        const task = entity as WorkItemEntity;
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
          const parentTask = await this.workItemRepo.findOne({
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
        const bug = entity as WorkItemEntity;
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
      case 'feature_module':
        return this.featureModuleRepo.findOne({ where: { id: entityId, deleted: false } });
      case 'task':
      case 'bug':
        return this.workItemRepo.findOne({ where: { id: entityId, deleted: false } });
      default:
        return null;
    }
  }

  private validateHierarchyRelation(entityType: EntityType, parentType: string) {
    const validRelations: Record<EntityType, string[]> = {
      'requirement': [],
      'feature_module': ['requirement'],
      'task': ['requirement', 'feature_module', 'task'],
      'bug': ['feature_module'],
    };

    const validParents = validRelations[entityType];
    if (!validParents || !validParents.includes(parentType)) {
      throw new BadRequestException(`无效的层级关�? ${entityType} 不能属于 ${parentType}`);
    }
  }

  private async performMove(entityType: EntityType, entityId: string, newParentType?: string, newParentId?: string) {
    switch (entityType) {
      case 'feature_module':
        if (newParentType === 'requirement') {
          await this.featureModuleRepo.update(entityId, { requirementId: newParentId });
        }
        break;
      case 'task':
        if (newParentType === 'requirement') {
          await this.workItemRepo.update(entityId, { 
            requirementId: newParentId,
            featureModuleId: undefined,
            parentId: undefined
          });
        } else if (newParentType === 'feature_module') {
          await this.workItemRepo.update(entityId, { 
            featureModuleId: newParentId,
            requirementId: undefined,
            parentId: undefined
          });
        } else if (newParentType === 'task') {
          await this.workItemRepo.update(entityId, { 
            parentId: newParentId,
            requirementId: undefined,
            featureModuleId: undefined
          });
        }
        break;
      case 'bug':
        if (newParentType === 'feature_module') {
          await this.workItemRepo.update(entityId, { 
            featureModuleId: newParentId,
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

  private buildTaskNodes(tasks: WorkItemEntity[]): HierarchyNode[] {
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

  private buildBugNodes(bugs: WorkItemEntity[]): HierarchyNode[] {
    return bugs.map(bug => ({
      id: bug.id,
      type: 'bug' as EntityType,
      title: bug.title,
      state: bug.state,
    }));
  }

  private async getRequirementChildren(requirementId: string): Promise<HierarchyNode[]> {
    const [featureModules, tasks] = await Promise.all([
      this.featureModuleRepo.find({ where: { requirementId, deleted: false } }),
      this.workItemRepo.find({ where: { requirementId, deleted: false, type: 'task' } }),
    ]);

    return [
      ...featureModules.map(fm => ({ id: fm.id, type: 'feature_module' as EntityType, title: fm.title, state: fm.state })),
      ...tasks.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state })),
    ];
  }

  private async getFeatureModuleChildren(featureModuleId: string): Promise<HierarchyNode[]> {
    const [tasks, bugs] = await Promise.all([
      this.workItemRepo.find({ where: { featureModuleId, deleted: false, type: 'task' } }),
      this.workItemRepo.find({ where: { featureModuleId, deleted: false, type: 'bug' } }),
    ]);

    return [
      ...tasks.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state })),
      ...bugs.map(bug => ({ id: bug.id, type: 'bug' as EntityType, title: bug.title, state: bug.state })),
    ];
  }

  private async getTaskChildren(taskId: string): Promise<HierarchyNode[]> {
    const children = await this.workItemRepo.find({ where: { parentId: taskId, deleted: false } });
    return children.map(task => ({ id: task.id, type: 'task' as EntityType, title: task.title, state: task.state }));
  }
}
