import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SprintEntity } from './sprint.entity';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(SprintEntity)
    private readonly repo: Repository<SprintEntity>,
  ) {}

  async paginate(params: { page: number; pageSize: number; projectId?: string; q?: string }) {
    const { page, pageSize, projectId, q } = params;
    const qb = this.repo.createQueryBuilder('s');
    if (projectId) qb.andWhere('s.projectId = :projectId', { projectId });
    if (q) qb.andWhere('s.name LIKE :q', { q: `%${q}%` });
    qb.orderBy('s.startAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items, page, pageSize, total };
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<SprintEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<SprintEntity>) {
    const entity = await this.findOne(id);
    if (!entity) throw new Error('Sprint not found');
    Object.assign(entity, data);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    await this.repo.delete(id);
  }
}


