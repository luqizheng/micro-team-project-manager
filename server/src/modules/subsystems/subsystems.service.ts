import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubsystemEntity } from './subsystem.entity';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementEntity } from '../requirements/requirement.entity';

export interface CreateSubsystemDto {
  title: string;
  description?: string;
  state?: string;
  assigneeId?: string;
  labels?: string[];
  requirementId?: string;
}

export interface UpdateSubsystemDto {
  title?: string;
  description?: string;
  state?: string;
  assigneeId?: string;
  labels?: string[];
  requirementId?: string;
}

export interface SubsystemQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  state?: string;
  assigneeId?: string;
  requirementId?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class SubsystemsService {
  private readonly logger = new Logger(SubsystemsService.name);

  constructor(
    @InjectRepository(SubsystemEntity)
    private readonly subsystemRepo: Repository<SubsystemEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(RequirementEntity)
    private readonly requirementRepo: Repository<RequirementEntity>,
  ) {}

  /**
   * 创建子系统
   */
  async create(projectId: string, dto: CreateSubsystemDto): Promise<SubsystemEntity> {
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

    const subsystem = this.subsystemRepo.create({
      projectId,
      requirementId: dto.requirementId,
      title: dto.title,
      description: dto.description,
      state: dto.state || 'open',
      assigneeId: dto.assigneeId,
      labels: dto.labels,
    });

    const saved = await this.subsystemRepo.save(subsystem);
    this.logger.log(`创建子系统成功: ${saved.id}`);
    return saved;
  }

  /**
   * 更新子系统
   */
  async update(id: string, dto: UpdateSubsystemDto): Promise<SubsystemEntity> {
    const subsystem = await this.subsystemRepo.findOne({ where: { id, deleted: false } });
    if (!subsystem) {
      throw new NotFoundException('子系统不存在');
    }

    // 验证需求存在（如果指定了需求ID）
    if (dto.requirementId) {
      const requirement = await this.requirementRepo.findOne({ 
        where: { id: dto.requirementId, projectId: subsystem.projectId, deleted: false } 
      });
      if (!requirement) {
        throw new NotFoundException('需求不存在');
      }
    }

    Object.assign(subsystem, dto);

    const saved = await this.subsystemRepo.save(subsystem);
    this.logger.log(`更新子系统成功: ${saved.id}`);
    return saved;
  }

  /**
   * 删除子系统
   */
  async delete(id: string): Promise<void> {
    const subsystem = await this.subsystemRepo.findOne({ where: { id, deleted: false } });
    if (!subsystem) {
      throw new NotFoundException('子系统不存在');
    }

    // 软删除
    await this.subsystemRepo.update(id, { deleted: true });
    this.logger.log(`删除子系统成功: ${id}`);
  }

  /**
   * 根据ID获取子系统
   */
  async findById(id: string): Promise<SubsystemEntity> {
    const subsystem = await this.subsystemRepo.findOne({
      where: { id, deleted: false },
      relations: ['requirement', 'featureModules', 'tasks', 'bugs'],
    });

    if (!subsystem) {
      throw new NotFoundException('子系统不存在');
    }

    return subsystem;
  }

  /**
   * 分页查询子系统
   */
  async paginate(params: SubsystemQueryParams) {
    const {
      projectId,
      page = 1,
      pageSize = 20,
      q,
      state,
      assigneeId,
      requirementId,
      sortField = 'updatedAt',
      sortOrder = 'DESC',
    } = params;

    const qb = this.subsystemRepo
      .createQueryBuilder('s')
      .leftJoin('users', 'assignee', 'assignee.id = s.assigneeId')
      .leftJoin('requirements', 'requirement', 'requirement.id = s.requirementId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('requirement.title', 'requirementTitle')
      .where('s.projectId = :projectId', { projectId })
      .andWhere('s.deleted = false');

    if (q) {
      qb.andWhere('s.title LIKE :q', { q: `%${q}%` });
    }
    if (state) {
      qb.andWhere('s.state = :state', { state });
    }
    if (assigneeId) {
      qb.andWhere('s.assigneeId = :assigneeId', { assigneeId });
    }
    if (requirementId) {
      qb.andWhere('s.requirementId = :requirementId', { requirementId });
    }

    // 排序
    const safeFields = new Set(['title', 'state', 'createdAt', 'updatedAt']);
    const field = safeFields.has(sortField) ? `s.${sortField}` : 's.updatedAt';
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
   * 根据需求获取子系统
   */
  async getByRequirement(requirementId: string): Promise<SubsystemEntity[]> {
    return this.subsystemRepo.find({
      where: { requirementId, deleted: false },
      relations: ['featureModules', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取项目的所有子系统
   */
  async getByProject(projectId: string): Promise<SubsystemEntity[]> {
    return this.subsystemRepo.find({
      where: { projectId, deleted: false },
      relations: ['requirement', 'featureModules', 'tasks', 'bugs'],
      order: { createdAt: 'ASC' },
    });
  }
}
