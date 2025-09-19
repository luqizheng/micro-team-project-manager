import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkItemEntity } from './work-item.entity';

export interface CreateWorkItemDto {
  projectId: string;
  type: 'task' | 'bug';
  title: string;
  description?: string;
  state: string;
  priority?: string;
  severity?: string; // bug 专属
  assigneeId?: string;
  reporterId?: string;
  requirementId?: string;
  subsystemId?: string;
  featureModuleId?: string;
  storyPoints?: number;
  estimateMinutes?: number;
  remainingMinutes?: number;
  estimatedHours?: number | null;
  actualHours?: number | null;
  sprintId?: string;
  releaseId?: string;
  parentId?: string;
  labels?: string[];
  dueAt?: string | Date;
}

export interface UpdateWorkItemDto extends Partial<CreateWorkItemDto> {}

export interface PaginateParams {
  projectId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  state?: string;
  type?: 'task' | 'bug';
  assigneeId?: string;
  priority?: string;
}

@Injectable()
export class WorkItemsService {
  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly repo: Repository<WorkItemEntity>,
  ) {}

  private ensureTypeValid(type?: string) {
    if (!type) return;
    if (type !== 'task' && type !== 'bug') {
      throw new BadRequestException('type must be task or bug');
    }
  }

  async create(dto: CreateWorkItemDto): Promise<WorkItemEntity> {
    this.ensureTypeValid(dto.type);
    if (dto.type === 'bug' && !dto.severity) {
      throw new BadRequestException('severity is required for bug');
    }
    const entity = this.repo.create({
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateWorkItemDto): Promise<WorkItemEntity> {
    const found = await this.repo.findOne({ where: { id, deleted: false } });
    if (!found) throw new NotFoundException('WorkItem not found');
    if (dto.type) this.ensureTypeValid(dto.type);
    if ((dto.type || found.type) === 'bug' && dto.severity === undefined) {
      // 保持原有 severity；若传入 null/空字符串，由数据库允�?
    }
    Object.assign(found, {
      ...dto,
      dueAt: dto.dueAt !== undefined ? (dto.dueAt ? new Date(dto.dueAt) : null) : found.dueAt,
    });
    return this.repo.save(found);
  }

  async findById(id: string): Promise<WorkItemEntity> {
    const found = await this.repo.findOne({ where: { id, deleted: false } });
    if (!found) throw new NotFoundException('WorkItem not found');
    return found;
  }

  async paginate(params: PaginateParams) {
    const { projectId, page = 1, pageSize = 20, q, state, type, assigneeId, priority } = params;
    const qb = this.repo.createQueryBuilder('w').where('w.deleted = false');
    if (projectId) qb.andWhere('w.projectId = :projectId', { projectId });
    if (q) qb.andWhere('w.title LIKE :q', { q: `%${q}%` });
    if (state) qb.andWhere('w.state = :state', { state });
    if (priority) qb.andWhere('w.priority = :priority', { priority });
    if (assigneeId) qb.andWhere('w.assigneeId = :assigneeId', { assigneeId });
    if (type) {
      this.ensureTypeValid(type);
      qb.andWhere('w.type = :type', { type });
    }
    qb.orderBy('w.updatedAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async softDelete(id: string): Promise<void> {
    const found = await this.repo.findOne({ where: { id, deleted: false } });
    if (!found) throw new NotFoundException('WorkItem not found');
    found.deleted = true;
    await this.repo.save(found);
  }
}


