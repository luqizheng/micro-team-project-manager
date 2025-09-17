import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleaseEntity } from './release.entity';
import { TasksService } from '../tasks/tasks.service';
import { BugsService } from '../bugs/bugs.service';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(ReleaseEntity) private readonly repo: Repository<ReleaseEntity>,
    private readonly tasksService: TasksService,
    private readonly bugsService: BugsService,
  ) {}

  list(projectId: string, opts: { q?: string; released?: 'released' | 'draft'; sortField?: string; sortOrder?: 'ASC' | 'DESC' } = {}) {
    const { q, released, sortField, sortOrder } = opts;
    const qb = this.repo.createQueryBuilder('r').where('r.projectId = :projectId', { projectId });
    
    if (q) {
      qb.andWhere('r.name LIKE :q OR r.tag LIKE :q', { q: `%${q}%` });
    }
    
    if (released === 'released') {
      qb.andWhere('r.releasedAt IS NOT NULL');
    } else if (released === 'draft') {
      qb.andWhere('r.releasedAt IS NULL');
    }
    
    const safeFields = new Set(['name', 'tag', 'createdAt', 'releasedAt']);
    const field = safeFields.has(String(sortField || '')) ? `r.${sortField}` : 'r.createdAt';
    const order: 'ASC' | 'DESC' = sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';
    qb.orderBy(field, order);
    
    return qb.getMany();
  }

  create(projectId: string, data: { name: string; tag: string; notes?: string }) {
    return this.repo.save(this.repo.create({ projectId, ...data }));
  }

  async publish(projectId: string, id: string) {
    const release = await this.repo.findOne({ where: { id, projectId } });
    if (!release) throw new Error('Release not found');

    // 获取所有任务和缺陷
    const [tasksResult, bugsResult] = await Promise.all([
      this.tasksService.paginate({ projectId, page: 1, pageSize: 1000 }),
      this.bugsService.paginate({ projectId, page: 1, pageSize: 1000 })
    ]);

    const items = [
      ...tasksResult.items.map(task => ({ ...task, type: 'task' })),
      ...bugsResult.items.map(bug => ({ ...bug, type: 'bug' }))
    ];

    const grouped = this.groupIssues(items);
    const notes = this.renderNotes(release, grouped);

    release.notes = notes;
    release.releasedAt = new Date();
    return this.repo.save(release);
  }

  private groupIssues(items: any[]) {
    const byType: Record<string, any[]> = { requirement: [], task: [], bug: [] };
    for (const it of items) {
      if (byType[it.type]) byType[it.type].push(it);
    }
    return byType;
  }

  private renderNotes(release: ReleaseEntity, grouped: Record<string, any[]>) {
    const sections = [
      `# Release ${release.name} (${release.tag})`,
      '',
      '## Changes',
    ];
    const order: Array<[string, string]> = [
      ['requirement', 'Features'],
      ['task', 'Improvements'],
      ['bug', 'Fixes'],
    ];
    for (const [key, title] of order) {
      const list = grouped[key] || [];
      if (list.length === 0) continue;
      sections.push(`### ${title}`);
      for (const it of list) {
        sections.push(`- ${it.title} (#${it.id.slice(0, 8)})`);
      }
      sections.push('');
    }
    return sections.join('\n');
  }
}


