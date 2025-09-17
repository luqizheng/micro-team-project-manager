import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureModuleEntity } from './feature-module.entity';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementEntity } from '../requirements/requirement.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';

export interface CreateFeatureModuleDto {
  title: string;
  description?: string;
  state?: string;
  assigneeId?: string;
  labels?: string[];
  requirementId?: string;
  subsystemId?: string;
}

export interface UpdateFeatureModuleDto {
  title?: string;
  description?: string;
  state?: string;
  assigneeId?: string;
  labels?: string[];
  requirementId?: string;
  subsystemId?: string;
}

export interface FeatureModuleQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  state?: string;
  assigneeId?: string;
  requirementId?: string;
  subsystemId?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class FeatureModulesService {
  private readonly logger = new Logger(FeatureModulesService.name);

  constructor(
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepo: Repository<FeatureModuleEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(RequirementEntity)
    private readonly requirementRepo: Repository<RequirementEntity>,
    @InjectRepository(SubsystemEntity)
    private readonly subsystemRepo: Repository<SubsystemEntity>,
  ) {}

  /**
   * 创建功能模块
   */
  async create(projectId: string, dto: CreateFeatureModuleDto): Promise<FeatureModuleEntity> {
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

    const featureModule = this.featureModuleRepo.create({
      projectId,
      requirementId: dto.requirementId,
      subsystemId: dto.subsystemId,
      title: dto.title,
      description: dto.description,
      state: dto.state || 'open',
      assigneeId: dto.assigneeId,
      labels: dto.labels,
    });

    const saved = await this.featureModuleRepo.save(featureModule);
    this.logger.log(`创建功能模块成功: ${saved.id}`);
    return saved;
  }

  /**
   * 更新功能模块
   */
  async update(id: string, dto: UpdateFeatureModuleDto): Promise<FeatureModuleEntity> {
    const featureModule = await this.featureModuleRepo.findOne({ where: { id, deleted: false } });
    if (!featureModule) {
      throw new NotFoundException('功能模块不存在');
    }

    // 验证需求存在（如果指定了需求ID）
    if (dto.requirementId) {
      const requirement = await this.requirementRepo.findOne({ 
        where: { id: dto.requirementId, projectId: featureModule.projectId, deleted: false } 
      });
      if (!requirement) {
        throw new NotFoundException('需求不存在');
      }
    }

    // 验证子系统存在（如果指定了子系统ID）
    if (dto.subsystemId) {
      const subsystem = await this.subsystemRepo.findOne({ 
        where: { id: dto.subsystemId, projectId: featureModule.projectId, deleted: false } 
      });
      if (!subsystem) {
        throw new NotFoundException('子系统不存在');
      }
    }

    Object.assign(featureModule, dto);

    const saved = await this.featureModuleRepo.save(featureModule);
    this.logger.log(`更新功能模块成功: ${saved.id}`);
    return saved;
  }

  /**
   * 删除功能模块
   */
  async delete(id: string): Promise<void> {
    const featureModule = await this.featureModuleRepo.findOne({ where: { id, deleted: false } });
    if (!featureModule) {
      throw new NotFoundException('功能模块不存在');
    }

    // 软删除
    await this.featureModuleRepo.update(id, { deleted: true });
    this.logger.log(`删除功能模块成功: ${id}`);
  }

  /**
   * 根据ID获取功能模块
   */
  async findById(id: string): Promise<FeatureModuleEntity> {
    const featureModule = await this.featureModuleRepo.findOne({
      where: { id, deleted: false },
      relations: ['requirement', 'subsystem', 'tasks', 'bugs'],
    });

    if (!featureModule) {
      throw new NotFoundException('功能模块不存在');
    }

    return featureModule;
  }

  /**
   * 分页查询功能模块
   */
  async paginate(params: FeatureModuleQueryParams) {
    const {
      projectId,
      page = 1,
      pageSize = 20,
      q,
      state,
      assigneeId,
      requirementId,
      subsystemId,
      sortField = 'updatedAt',
      sortOrder = 'DESC',
    } = params;

    const qb = this.featureModuleRepo
      .createQueryBuilder('fm')
      .leftJoin('users', 'assignee', 'assignee.id = fm.assigneeId')
      .leftJoin('requirements', 'requirement', 'requirement.id = fm.requirementId')
      .leftJoin('subsystems', 'subsystem', 'subsystem.id = fm.subsystemId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('requirement.title', 'requirementTitle')
      .addSelect('subsystem.title', 'subsystemTitle')
      .where('fm.projectId = :projectId', { projectId })
      .andWhere('fm.deleted = false');

    if (q) {
      qb.andWhere('fm.title LIKE :q', { q: `%${q}%` });
    }
    if (state) {
      qb.andWhere('fm.state = :state', { state });
    }
    if (assigneeId) {
      qb.andWhere('fm.assigneeId = :assigneeId', { assigneeId });
    }
    if (requirementId) {
      qb.andWhere('fm.requirementId = :requirementId', { requirementId });
    }
    if (subsystemId) {
      qb.andWhere('fm.subsystemId = :subsystemId', { subsystemId });
    }

    // 排序
    const safeFields = new Set(['title', 'state', 'createdAt', 'updatedAt']);
    const field = safeFields.has(sortField) ? `fm.${sortField}` : 'fm.updatedAt';
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
   * 根据需求获取功能模块
   */
  async getByRequirement(requirementId: string): Promise<FeatureModuleEntity[]> {
    return this.featureModuleRepo.find({
      where: { requirementId, deleted: false },
      relations: ['subsystem', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据子系统获取功能模块
   */
  async getBySubsystem(subsystemId: string): Promise<FeatureModuleEntity[]> {
    return this.featureModuleRepo.find({
      where: { subsystemId, deleted: false },
      relations: ['requirement', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取项目的所有功能模块
   */
  async getByProject(projectId: string): Promise<FeatureModuleEntity[]> {
    return this.featureModuleRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'subsystem', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });
  }
}
