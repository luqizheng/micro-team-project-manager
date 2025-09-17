import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BugEntity } from './bug.entity';
import { ProjectEntity } from '../projects/project.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';

export interface CreateBugDto {
  title: string;
  description?: string;
  state?: string;
  priority?: string;
  severity?: string;
  assigneeId?: string;
  reporterId?: string;
  labels?: string[];
  dueAt?: string;
  subsystemId?: string;
  featureModuleId?: string;
}

export interface UpdateBugDto {
  title?: string;
  description?: string;
  state?: string;
  priority?: string;
  severity?: string;
  assigneeId?: string;
  reporterId?: string;
  labels?: string[];
  dueAt?: string;
  subsystemId?: string;
  featureModuleId?: string;
}

export interface BugQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  state?: string;
  assigneeId?: string;
  priority?: string;
  severity?: string;
  subsystemId?: string;
  featureModuleId?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class BugsService {
  private readonly logger = new Logger(BugsService.name);

  constructor(
    @InjectRepository(BugEntity)
    private readonly bugRepo: Repository<BugEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(SubsystemEntity)
    private readonly subsystemRepo: Repository<SubsystemEntity>,
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepo: Repository<FeatureModuleEntity>,
  ) {}

  /**
   * 创建缺陷
   */
  async create(projectId: string, dto: CreateBugDto): Promise<BugEntity> {
    // 验证项目存在
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('项目不存在');
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

    const bug = this.bugRepo.create({
      projectId,
      subsystemId: dto.subsystemId,
      featureModuleId: dto.featureModuleId,
      title: dto.title,
      description: dto.description,
      state: dto.state || 'open',
      priority: dto.priority,
      severity: dto.severity,
      assigneeId: dto.assigneeId,
      reporterId: dto.reporterId,
      labels: dto.labels,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });

    const saved = await this.bugRepo.save(bug);
    this.logger.log(`创建缺陷成功: ${saved.id}`);
    return saved;
  }

  /**
   * 更新缺陷
   */
  async update(id: string, dto: UpdateBugDto): Promise<BugEntity> {
    const bug = await this.bugRepo.findOne({ where: { id, deleted: false } });
    if (!bug) {
      throw new NotFoundException('缺陷不存在');
    }

    // 验证子系统存在（如果指定了子系统ID）
    if (dto.subsystemId) {
      const subsystem = await this.subsystemRepo.findOne({ 
        where: { id: dto.subsystemId, projectId: bug.projectId, deleted: false } 
      });
      if (!subsystem) {
        throw new NotFoundException('子系统不存在');
      }
    }

    // 验证功能模块存在（如果指定了功能模块ID）
    if (dto.featureModuleId) {
      const featureModule = await this.featureModuleRepo.findOne({ 
        where: { id: dto.featureModuleId, projectId: bug.projectId, deleted: false } 
      });
      if (!featureModule) {
        throw new NotFoundException('功能模块不存在');
      }
    }

    Object.assign(bug, {
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : dto.dueAt,
    });

    const saved = await this.bugRepo.save(bug);
    this.logger.log(`更新缺陷成功: ${saved.id}`);
    return saved;
  }

  /**
   * 删除缺陷
   */
  async delete(id: string): Promise<void> {
    const bug = await this.bugRepo.findOne({ where: { id, deleted: false } });
    if (!bug) {
      throw new NotFoundException('缺陷不存在');
    }

    // 软删除
    await this.bugRepo.update(id, { deleted: true });
    this.logger.log(`删除缺陷成功: ${id}`);
  }

  /**
   * 根据ID获取缺陷
   */
  async findById(id: string): Promise<BugEntity> {
    const bug = await this.bugRepo.findOne({
      where: { id, deleted: false },
      relations: ['subsystem', 'featureModule'],
    });

    if (!bug) {
      throw new NotFoundException('缺陷不存在');
    }

    return bug;
  }

  /**
   * 分页查询缺陷
   */
  async paginate(params: BugQueryParams) {
    const {
      projectId,
      page = 1,
      pageSize = 20,
      q,
      state,
      assigneeId,
      priority,
      severity,
      subsystemId,
      featureModuleId,
      sortField = 'updatedAt',
      sortOrder = 'DESC',
    } = params;

    const qb = this.bugRepo
      .createQueryBuilder('b')
      .leftJoin('users', 'assignee', 'assignee.id = b.assigneeId')
      .leftJoin('users', 'reporter', 'reporter.id = b.reporterId')
      .leftJoin('subsystems', 'subsystem', 'subsystem.id = b.subsystemId')
      .leftJoin('feature_modules', 'featureModule', 'featureModule.id = b.featureModuleId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('reporter.name', 'reporterName')
      .addSelect('reporter.email', 'reporterEmail')
      .addSelect('subsystem.title', 'subsystemTitle')
      .addSelect('featureModule.title', 'featureModuleTitle')
      .where('b.projectId = :projectId', { projectId })
      .andWhere('b.deleted = false');

    if (q) {
      qb.andWhere('b.title LIKE :q', { q: `%${q}%` });
    }
    if (state) {
      qb.andWhere('b.state = :state', { state });
    }
    if (assigneeId) {
      qb.andWhere('b.assigneeId = :assigneeId', { assigneeId });
    }
    if (priority) {
      qb.andWhere('b.priority = :priority', { priority });
    }
    if (severity) {
      qb.andWhere('b.severity = :severity', { severity });
    }
    if (subsystemId) {
      qb.andWhere('b.subsystemId = :subsystemId', { subsystemId });
    }
    if (featureModuleId) {
      qb.andWhere('b.featureModuleId = :featureModuleId', { featureModuleId });
    }

    // 排序
    const safeFields = new Set(['title', 'state', 'priority', 'severity', 'createdAt', 'updatedAt']);
    const field = safeFields.has(sortField) ? `b.${sortField}` : 'b.updatedAt';
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
   * 根据子系统获取缺陷
   */
  async getBySubsystem(subsystemId: string): Promise<BugEntity[]> {
    return this.bugRepo.find({
      where: { subsystemId, deleted: false },
      relations: ['featureModule'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据功能模块获取缺陷
   */
  async getByFeatureModule(featureModuleId: string): Promise<BugEntity[]> {
    return this.bugRepo.find({
      where: { featureModuleId, deleted: false },
      relations: ['subsystem'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取项目的所有缺陷
   */
  async getByProject(projectId: string): Promise<BugEntity[]> {
    return this.bugRepo.find({
      where: { projectId, deleted: false },
      relations: ['subsystem', 'featureModule'],
      order: { createdAt: 'ASC' },
    });
  }
}
