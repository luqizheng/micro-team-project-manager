import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueEntity, IssueType } from './issue.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(IssueEntity)
    private readonly repo: Repository<IssueEntity>,
  ) {}

  async paginate(params: { page: number; pageSize: number; q?: string; type?: IssueType; state?: string; assigneeId?: string; sprintId?: string; sortField?: string; sortOrder?: 'ASC' | 'DESC' }) {
    const { page, pageSize, q, type, state, assigneeId, sprintId, sortField, sortOrder } = params;
    const qb = this.repo.createQueryBuilder('i');
    if (q) qb.andWhere('i.title LIKE :q', { q: `%${q}%` });
    if (type) qb.andWhere('i.type = :type', { type });
    if (state) qb.andWhere('i.state = :state', { state });
    if (assigneeId) qb.andWhere('i.assigneeId = :assigneeId', { assigneeId });
    if (sprintId) qb.andWhere('i.sprintId = :sprintId', { sprintId });
    const safeFields = new Set(['title','type','state','estimatedHours','actualHours','createdAt','updatedAt']);
    const field = safeFields.has(String(sortField || '')) ? `i.${sortField}` : 'i.updatedAt';
    const order: 'ASC' | 'DESC' = sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';
    qb.orderBy(field, order);
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();

    const qbSum = this.repo.createQueryBuilder('i');
    if (q) qbSum.andWhere('i.title LIKE :q', { q: `%${q}%` });
    if (type) qbSum.andWhere('i.type = :type', { type });
    if (state) qbSum.andWhere('i.state = :state', { state });
    if (assigneeId) qbSum.andWhere('i.assigneeId = :assigneeId', { assigneeId });
    if (sprintId) qbSum.andWhere('i.sprintId = :sprintId', { sprintId });
    const sums = await qbSum
      .select('COALESCE(SUM(i.estimated_hours), 0)', 'totalEstimated')
      .addSelect('COALESCE(SUM(i.actual_hours), 0)', 'totalActual')
      .getRawOne<{ totalEstimated: string; totalActual: string }>();
    const totalEstimated = sums ? parseFloat(sums.totalEstimated) : 0;
    const totalActual = sums ? parseFloat(sums.totalActual) : 0;

    return { items, page, pageSize, total, totalEstimated, totalActual };
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<IssueEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<IssueEntity>) {
    const entity = await this.findOne(id);
    if (!entity) throw new Error('Issue not found');
    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    await this.repo.delete(id);
  }
}


