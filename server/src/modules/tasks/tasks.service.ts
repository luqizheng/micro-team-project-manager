import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementEntity } from '../requirements/requirement.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';

export interface CreateTaskDto {
  title: string;
  description?: string;
  state?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  estimateMinutes?: number;
  remainingMinutes?: number;
  estimatedHours?: number;
  actualHours?: number;
  sprintId?: string;
  releaseId?: string;
  parentId?: string;
  labels?: string[];
  dueAt?: string;
  requirementId?: string;
  subsystemId?: string;
  featureModuleId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  state?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  estimateMinutes?: number;
  remainingMinutes?: number;
  estimatedHours?: number;
  actualHours?: number;
  sprintId?: string;
  releaseId?: string;
  parentId?: string;
  labels?: string[];
  dueAt?: string;
  requirementId?: string;
  subsystemId?: string;
  featureModuleId?: string;
}

export interface TaskQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  state?: string;
  assigneeId?: string;
  priority?: string;
  requirementId?: string;
  subsystemId?: string;
  featureModuleId?: string;
  parentId?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(RequirementEntity)
    private readonly requirementRepo: Repository<RequirementEntity>,
    @InjectRepository(SubsystemEntity)
    private readonly subsystemRepo: Repository<SubsystemEntity>,
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepo: Repository<FeatureModuleEntity>,
  ) {}

  /**
   * 创建任务
   */
  async create(projectId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    // 验证项目存在
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 验证需求存在（如果指定了需求ID）
    if (dto.requirementId) {
      const requirement = await this.requirementRepo.findOne({ 
        where: { id: dto.requirementId, projectId, deleted: false } 
      });
      if (!requirement) {
        throw new NotFoundException('需求不存在');
      }
    }

    // 验证子系统存在（如果指定了子系统ID）
    if (dto.subsystemId) {
      const subsystem = await this.subsystemRepo.findOne({ 
        where: { id: dto.subsystemId, projectId, deleted: false } 
      });
      if (!subsystem) {
        throw new NotFoundException('子系统不存在');
      }
    }

    // 验证功能模块存在（如果指定了功能模块ID）
    if (dto.featureModuleId) {
      const featureModule = await this.featureModuleRepo.findOne({ 
        where: { id: dto.featureModuleId, projectId, deleted: false } 
      });
      if (!featureModule) {
        throw new NotFoundException('功能模块不存在');
      }
    }

    // 验证父任务存在（如果指定了父任务ID）
    if (dto.parentId) {
      const parentTask = await this.taskRepo.findOne({ 
        where: { id: dto.parentId, projectId, deleted: false } 
      });
      if (!parentTask) {
        throw new NotFoundException('父任务不存在');
      }
    }

    const task = this.taskRepo.create({
      projectId,
      requirementId: dto.requirementId,
      subsystemId: dto.subsystemId,
      featureModuleId: dto.featureModuleId,
      title: dto.title,
      description: dto.description,
      state: dto.state || 'open',
      priority: dto.priority,
      assigneeId: dto.assigneeId,
      reporterId: dto.reporterId,
      storyPoints: dto.storyPoints,
      estimateMinutes: dto.estimateMinutes,
      remainingMinutes: dto.remainingMinutes,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      sprintId: dto.sprintId,
      releaseId: dto.releaseId,
      parentId: dto.parentId,
      labels: dto.labels,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });

    const saved = await this.taskRepo.save(task);
    this.logger.log(`创建任务成功: ${saved.id}`);
    return saved;
  }

  /**
   * 更新任务
   */
  async update(id: string, dto: UpdateTaskDto): Promise<TaskEntity> {
    const task = await this.taskRepo.findOne({ where: { id, deleted: false } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 验证需求存在（如果指定了需求ID）
    if (dto.requirementId) {
      const requirement = await this.requirementRepo.findOne({ 
        where: { id: dto.requirementId, projectId: task.projectId, deleted: false } 
      });
      if (!requirement) {
        throw new NotFoundException('需求不存在');
      }
    }

    // 验证子系统存在（如果指定了子系统ID）
    if (dto.subsystemId) {
      const subsystem = await this.subsystemRepo.findOne({ 
        where: { id: dto.subsystemId, projectId: task.projectId, deleted: false } 
      });
      if (!subsystem) {
        throw new NotFoundException('子系统不存在');
      }
    }

    // 验证功能模块存在（如果指定了功能模块ID）
    if (dto.featureModuleId) {
      const featureModule = await this.featureModuleRepo.findOne({ 
        where: { id: dto.featureModuleId, projectId: task.projectId, deleted: false } 
      });
      if (!featureModule) {
        throw new NotFoundException('功能模块不存在');
      }
    }

    // 验证父任务存在（如果指定了父任务ID）
    if (dto.parentId) {
      const parentTask = await this.taskRepo.findOne({ 
        where: { id: dto.parentId, projectId: task.projectId, deleted: false } 
      });
      if (!parentTask) {
        throw new NotFoundException('父任务不存在');
      }
    }

    Object.assign(task, {
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : dto.dueAt,
    });

    const saved = await this.taskRepo.save(task);
    this.logger.log(`更新任务成功: ${saved.id}`);
    return saved;
  }

  /**
   * 删除任务
   */
  async delete(id: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id, deleted: false } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 软删除
    await this.taskRepo.update(id, { deleted: true });
    this.logger.log(`删除任务成功: ${id}`);
  }

  /**
   * 根据ID获取任务
   */
  async findById(id: string): Promise<TaskEntity> {
    const task = await this.taskRepo.findOne({
      where: { id, deleted: false },
      relations: ['requirement', 'subsystem', 'featureModule', 'parent', 'children'],
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return task;
  }

  /**
   * 分页查询任务
   */
  async paginate(params: TaskQueryParams) {
    const {
      projectId,
      page = 1,
      pageSize = 20,
      q,
      state,
      assigneeId,
      priority,
      requirementId,
      subsystemId,
      featureModuleId,
      parentId,
      sortField = 'updatedAt',
      sortOrder = 'DESC',
    } = params;

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoin('users', 'assignee', 'assignee.id = t.assigneeId')
      .leftJoin('users', 'reporter', 'reporter.id = t.reporterId')
      .leftJoin('requirements', 'requirement', 'requirement.id = t.requirementId')
      .leftJoin('subsystems', 'subsystem', 'subsystem.id = t.subsystemId')
      .leftJoin('feature_modules', 'featureModule', 'featureModule.id = t.featureModuleId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('reporter.name', 'reporterName')
      .addSelect('reporter.email', 'reporterEmail')
      .addSelect('requirement.title', 'requirementTitle')
      .addSelect('subsystem.title', 'subsystemTitle')
      .addSelect('featureModule.title', 'featureModuleTitle')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deleted = false');

    if (q) {
      qb.andWhere('t.title LIKE :q', { q: `%${q}%` });
    }
    if (state) {
      qb.andWhere('t.state = :state', { state });
    }
    if (assigneeId) {
      qb.andWhere('t.assigneeId = :assigneeId', { assigneeId });
    }
    if (priority) {
      qb.andWhere('t.priority = :priority', { priority });
    }
    if (requirementId) {
      qb.andWhere('t.requirementId = :requirementId', { requirementId });
    }
    if (subsystemId) {
      qb.andWhere('t.subsystemId = :subsystemId', { subsystemId });
    }
    if (featureModuleId) {
      qb.andWhere('t.featureModuleId = :featureModuleId', { featureModuleId });
    }
    if (parentId) {
      qb.andWhere('t.parentId = :parentId', { parentId });
    }

    // 排序
    const safeFields = new Set(['title', 'state', 'priority', 'storyPoints', 'estimatedHours', 'actualHours', 'createdAt', 'updatedAt']);
    const field = safeFields.has(sortField) ? `t.${sortField}` : 't.updatedAt';
    qb.orderBy(field, sortOrder);

    // 分页
    const offset = (page - 1) * pageSize;
    qb.skip(offset).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据需求获取任务
   */
  async getByRequirement(requirementId: string): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      where: { requirementId, deleted: false },
      relations: ['subsystem', 'featureModule', 'parent', 'children'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据子系统获取任务
   */
  async getBySubsystem(subsystemId: string): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      where: { subsystemId, deleted: false },
      relations: ['requirement', 'featureModule', 'parent', 'children'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据功能模块获取任务
   */
  async getByFeatureModule(featureModuleId: string): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      where: { featureModuleId, deleted: false },
      relations: ['requirement', 'subsystem', 'parent', 'children'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取子任务
   */
  async getChildren(parentId: string): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      where: { parentId, deleted: false },
      relations: ['requirement', 'subsystem', 'featureModule'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取项目的所有任务
   */
  async getByProject(projectId: string): Promise<TaskEntity[]> {
    return this.taskRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'subsystem', 'featureModule', 'parent', 'children'],
      order: { createdAt: 'ASC' },
    });
  }
}
