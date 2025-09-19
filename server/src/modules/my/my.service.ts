import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkItemEntity } from '../work-items/work-item.entity';
import { MembershipsService } from '../memberships/memberships.service';

interface ListParams {
  userId: string;
  page: number;
  pageSize: number;
  q?: string;
  state?: string;
  priority?: string;
  type?: string; // task | bug | requirement (目前聚合 task、bug)
  sortBy?: string; // priority | dueDate | created | updated
}

@Injectable()
export class MyService {
  constructor(
    @InjectRepository(WorkItemEntity) private readonly wiRepo: Repository<WorkItemEntity>,
    private readonly memberships: MembershipsService,
  ) {}

  async listUserItems(params: ListParams) {
    const { userId, page, pageSize, q, state, priority, type, sortBy } = params;

    // 查询用户所属项目，用于范围过滤
    const memberships = await this.memberships.getUserMemberships(userId);
    const projectIds = memberships.map(m => m.projectId);
    if (projectIds.length === 0) {
      return { items: [], total: 0, totalEstimated: 0, totalActual: 0 };
    }

    // 统一�?work_items 查询
    const qb = this.wiRepo
      .createQueryBuilder('w')
      .leftJoin('projects', 'p', 'p.id = w.projectId')
      .leftJoin('users', 'assignee', 'assignee.id = w.assigneeId')
      .leftJoin('users', 'reporter', 'reporter.id = w.reporterId')
      .leftJoin('requirements', 'req', 'req.id = w.requirementId')
      .leftJoin('feature_modules', 'fm', 'fm.id = w.featureModuleId')
      .select([
        'w.id AS id',
        "CONCAT(p.key, '-', LPAD(CONV(RAND()*99999, 10, 10), 4, '0')) AS `key`",
        'w.type AS type',
        'w.title AS title',
        'w.state AS state',
        'w.priority AS priority',
        'w.severity AS severity',
        'w.estimated_hours AS estimatedHours',
        'w.actual_hours AS actualHours',
        'w.story_points AS storyPoints',
        'w.due_at AS dueAt',
        'w.created_at AS createdAt',
        'w.updated_at AS updatedAt',
        'w.project_id AS projectId',
        'p.name AS projectName',
        'p.`key` AS projectKey',
        'assignee.name AS assigneeName',
        'reporter.name AS reporterName',
        'req.title AS requirementTitle',
        'fm.title AS featureModuleTitle',
        
      ])
      .where('w.deleted = false')
      .andWhere('w.assignee_id = :userId', { userId })
      .andWhere('w.project_id IN (:...projectIds)', { projectIds });

    if (q) qb.andWhere('w.title LIKE :q', { q: `%${q}%` });
    if (state) qb.andWhere('w.state = :state', { state });
    if (priority) qb.andWhere('w.priority = :priority', { priority });
    if (type) qb.andWhere('w.type = :type', { type });

    const merged = await qb.getRawMany();

    // 排序
    const sortKey = sortBy === 'created' ? 'createdAt'
      : sortBy === 'dueDate' ? 'dueAt'
      : sortBy === 'priority' ? 'priority'
      : 'updatedAt';

    merged.sort((a, b) => {
      if (sortKey === 'priority') {
        const order: any = { urgent: 1, high: 2, medium: 3, low: 4 };
        return (order[a.priority] || 99) - (order[b.priority] || 99);
      }
      const av = a[sortKey] ? new Date(a[sortKey]).getTime() : 0;
      const bv = b[sortKey] ? new Date(b[sortKey]).getTime() : 0;
      return bv - av;
    });

    const total = merged.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = merged.slice(start, end);

    // 统计
    const totalEstimated = merged.reduce((sum, it) => sum + (Number(it.estimatedHours) || 0), 0);
    const totalActual = merged.reduce((sum, it) => sum + (Number(it.actualHours) || 0), 0);

    return { items, total, totalEstimated, totalActual };
  }
}


