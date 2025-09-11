import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleaseEntity } from './release.entity';
import { IssuesService } from '../issues/issues.service';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(ReleaseEntity) private readonly repo: Repository<ReleaseEntity>,
    private readonly issues: IssuesService,
  ) {}

  list(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { releasedAt: 'DESC' } });
  }

  create(projectId: string, data: { name: string; tag: string; notes?: string }) {
    return this.repo.save(this.repo.create({ projectId, ...data }));
  }

  async publish(projectId: string, id: string) {
    const release = await this.repo.findOne({ where: { id, projectId } });
    if (!release) throw new Error('Release not found');

    const changes = await this.issues.paginate({ page: 1, pageSize: 1000, q: undefined, type: undefined as any, state: undefined, assigneeId: undefined, sprintId: undefined });
    const items = changes.items.filter((i) => i.projectId === projectId);
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


