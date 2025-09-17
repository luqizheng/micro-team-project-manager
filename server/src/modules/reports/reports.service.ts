import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { WorkItemEntity } from '../work-items/work-item.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(WorkItemEntity) private readonly repo: Repository<WorkItemEntity>) {}

  async hours(projectId: string, opts: { from?: string; to?: string }) {
    const where: any = { projectId, deleted: false };
    if (opts.from && opts.to) {
      where.updatedAt = Between(new Date(opts.from), new Date(opts.to));
    }
    const tasks = await this.repo.find({ where });
    let estimated = 0;
    let actual = 0;
    for (const t of tasks) {
      estimated += t.estimatedHours || 0;
      actual += t.actualHours || 0;
    }
    return { estimated, actual, count: tasks.length };
  }
}


