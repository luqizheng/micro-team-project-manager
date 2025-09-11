import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
  ) {}

  async paginate(params: { page: number; pageSize: number; q?: string; visibility?: 'private' | 'public'; sortField?: string; sortOrder?: 'ASC' | 'DESC' }) {
    const { page, pageSize, q, visibility, sortField, sortOrder } = params;
    const qb = this.repo.createQueryBuilder('p');
    if (q) {
      qb.andWhere('p.name LIKE :q OR p.key LIKE :q', { q: `%${q}%` });
    }
    if (visibility) {
      qb.andWhere('p.visibility = :visibility', { visibility });
    }
    const safeFields = new Set(['key','name','visibility','createdAt','updatedAt']);
    const field = safeFields.has(String(sortField || '')) ? `p.${sortField}` : 'p.updatedAt';
    const order: 'ASC' | 'DESC' = sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';
    qb.orderBy(field, order);
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items, page, pageSize, total };
  }

  findOne(id: string): Promise<ProjectEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: { key: string; name: string; visibility?: string; createdBy: string }): Promise<ProjectEntity> {
    const existing = await this.repo.findOne({ where: { key: data.key } });
    if (existing) {
      throw new Error('Project key already exists');
    }
   
    const entity = this.repo.create({ visibility: 'private', ...data });
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Pick<ProjectEntity, 'name' | 'visibility' | 'archived'>>): Promise<ProjectEntity> {
    const entity = await this.findOne(id);
    if (!entity) throw new Error('Project not found');
    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}


