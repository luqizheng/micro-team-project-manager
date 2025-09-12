import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueEntity, IssueType } from './issue.entity';
import { IssueStatesService } from '../issue-states/issue-states.service';
import { ProjectEntity } from '../projects/project.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(IssueEntity)
    private readonly repo: Repository<IssueEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly issueStatesService: IssueStatesService,
  ) {}

  async paginate(params: { page: number; pageSize: number; q?: string; type?: IssueType; state?: string; assigneeId?: string; sprintId?: string; sortField?: string; sortOrder?: 'ASC' | 'DESC'; treeView?: boolean; parentId?: string }) {
    const { page, pageSize, q, type, state, assigneeId, sprintId, sortField, sortOrder, treeView, parentId } = params;
    
    if (treeView) {
      return this.getTreeView({ q, type, state, assigneeId, sprintId });
    }
    
    const qb = this.repo.createQueryBuilder('i')
      .leftJoin('users', 'assignee', 'assignee.id = i.assigneeId')
      .leftJoin('users', 'reporter', 'reporter.id = i.reporterId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('reporter.name', 'reporterName')
      .addSelect('reporter.email', 'reporterEmail');
    
    if (q) qb.andWhere('i.title LIKE :q', { q: `%${q}%` });
    if (type) qb.andWhere('i.type = :type', { type });
    if (state) qb.andWhere('i.state = :state', { state });
    if (assigneeId) qb.andWhere('i.assigneeId = :assigneeId', { assigneeId });
    if (sprintId) qb.andWhere('i.sprintId = :sprintId', { sprintId });
    if (parentId) qb.andWhere('i.parentId = :parentId', { parentId });
    const safeFields = new Set(['title','type','state','estimatedHours','actualHours','createdAt','updatedAt']);
    const field = safeFields.has(String(sortField || '')) ? `i.${sortField}` : 'i.updatedAt';
    const order: 'ASC' | 'DESC' = sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';
    qb.orderBy(field, order);
    qb.skip((page - 1) * pageSize).take(pageSize);
    const { entities, raw } = await qb.getRawAndEntities();
    
    // 合并实体数据和用户信息
    const items = entities.map((entity, index) => ({
      ...entity,
      assigneeName: raw[index]?.assigneeName,
      assigneeEmail: raw[index]?.assigneeEmail,
      reporterName: raw[index]?.reporterName,
      reporterEmail: raw[index]?.reporterEmail,
    }));
    
    const total = await qb.getCount();

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

  async create(data: Partial<IssueEntity>) {
    // 生成issue key
    if (!data.key && data.projectId) {
      data.key = await this.generateIssueKey(data.projectId);
    }
    
    return this.repo.save(this.repo.create(data));
  }

  /**
   * 为项目生成下一个issue key
   * @param projectId 项目ID
   * @returns 生成的issue key
   */
  private async generateIssueKey(projectId: string): Promise<string> {
    // 获取项目信息
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new Error('Project not found');
    }

    // 获取该项目下最大的issue序号
    const result = await this.repo
      .createQueryBuilder('issue')
      .select('MAX(CAST(SUBSTRING(issue.key, LENGTH(:projectKey) + 2) AS UNSIGNED))', 'maxNumber')
      .where('issue.projectId = :projectId', { projectId })
      .andWhere('issue.key LIKE :pattern', { pattern: `${project.key}_%` })
      .setParameters({ projectKey: project.key })
      .getRawOne();

    const maxNumber = result?.maxNumber || 0;
    const nextNumber = maxNumber + 1;

    return `${project.key}_${nextNumber}`;
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

  async getStatesByProjectAndType(projectId: string, issueType: IssueType) {
    return this.issueStatesService.findByProjectAndType(projectId, issueType);
  }

  async getTreeView(params: { q?: string; type?: IssueType; state?: string; assigneeId?: string; sprintId?: string }) {
    const { q, type, state, assigneeId, sprintId } = params;
    
    // 获取所有事项
    const qb = this.repo.createQueryBuilder('i')
      .leftJoin('users', 'assignee', 'assignee.id = i.assigneeId')
      .leftJoin('users', 'reporter', 'reporter.id = i.reporterId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('reporter.name', 'reporterName')
      .addSelect('reporter.email', 'reporterEmail')
      .orderBy('i.createdAt', 'DESC');
    
    if (q) qb.andWhere('i.title LIKE :q', { q: `%${q}%` });
    if (type) qb.andWhere('i.type = :type', { type });
    if (state) qb.andWhere('i.state = :state', { state });
    if (assigneeId) qb.andWhere('i.assigneeId = :assigneeId', { assigneeId });
    if (sprintId) qb.andWhere('i.sprintId = :sprintId', { sprintId });
    
    const { entities, raw } = await qb.getRawAndEntities();
    
    // 合并实体数据和用户信息
    const allIssues = entities.map((entity, index) => ({
      ...entity,
      assigneeName: raw[index]?.assigneeName,
      assigneeEmail: raw[index]?.assigneeEmail,
      reporterName: raw[index]?.reporterName,
      reporterEmail: raw[index]?.reporterEmail,
    }));
    
    // 构建树形结构
    const issueMap = new Map<string, any>();
    const rootIssues: any[] = [];
    
    // 先创建所有节点的映射
    allIssues.forEach(issue => {
      issueMap.set(issue.id, { ...issue, children: [] });
    });
    
    // 构建父子关系
    allIssues.forEach(issue => {
      if (issue.parentId && issueMap.has(issue.parentId)) {
        issueMap.get(issue.parentId).children.push(issueMap.get(issue.id));
      } else {
        rootIssues.push(issueMap.get(issue.id));
      }
    });
    
    // 计算总计
    const totalEstimated = allIssues.reduce((sum, issue) => sum + (issue.estimatedHours || 0), 0);
    const totalActual = allIssues.reduce((sum, issue) => sum + (issue.actualHours || 0), 0);
    
    return { 
      items: rootIssues, 
      total: allIssues.length, 
      totalEstimated, 
      totalActual 
    };
  }

  /**
   * 获取我的任务 - 包括我负责的任务和我报告的任务
   */
  async getMyTasks(params: { 
    userId: string; 
    page: number; 
    pageSize: number; 
    q?: string; 
    type?: IssueType; 
    state?: string; 
    priority?: string;
    sortBy?: string;
  }) {
    const { userId, page, pageSize, q, type, state, priority, sortBy } = params;
    
    const qb = this.repo.createQueryBuilder('i')
      .leftJoin('users', 'assignee', 'assignee.id = i.assigneeId')
      .leftJoin('users', 'reporter', 'reporter.id = i.reporterId')
      .leftJoin('projects', 'project', 'project.id = i.projectId')
      .addSelect('assignee.name', 'assigneeName')
      .addSelect('assignee.email', 'assigneeEmail')
      .addSelect('reporter.name', 'reporterName')
      .addSelect('reporter.email', 'reporterEmail')
      .addSelect('project.name', 'projectName')
      .addSelect('project.key', 'projectKey')
      .where('(i.assigneeId = :userId OR i.reporterId = :userId OR i.assigneeId is null)', { userId })
      .andWhere('i.deleted = false');
    
    // 搜索条件
    if (q) qb.andWhere('i.title LIKE :q', { q: `%${q}%` });
    if (type) qb.andWhere('i.type = :type', { type });
    if (state) qb.andWhere('i.state = :state', { state });
    if (priority) qb.andWhere('i.priority = :priority', { priority });
    
    // 排序逻辑
    if (sortBy === 'priority') {
      // 按优先级排序：先按优先级字段排序，再按更新时间
      qb.orderBy('i.priority', 'ASC')
        .addOrderBy('i.updatedAt', 'DESC');
    } else if (sortBy === 'dueDate') {
      qb.orderBy('i.dueAt', 'ASC')
        .addOrderBy('i.updatedAt', 'DESC');
    } else if (sortBy === 'created') {
      qb.orderBy('i.createdAt', 'DESC');
    } else {
      // 默认按更新时间排序
      qb.orderBy('i.updatedAt', 'DESC');
    }
    
    qb.skip((page - 1) * pageSize).take(pageSize);
    
    const { entities, raw } = await qb.getRawAndEntities();
    
    // 合并实体数据和用户信息
    const items = entities.map((entity, index) => ({
      ...entity,
      assigneeName: raw[index]?.assigneeName,
      assigneeEmail: raw[index]?.assigneeEmail,
      reporterName: raw[index]?.reporterName,
      reporterEmail: raw[index]?.reporterEmail,
      projectName: raw[index]?.projectName,
      projectKey: raw[index]?.projectKey,
    }));
    
    const total = await qb.getCount();
    
    // 计算工时统计
    const qbSum = this.repo.createQueryBuilder('i')
      .where('(i.assigneeId = :userId OR i.reporterId = :userId)', { userId })
      .andWhere('i.deleted = false');
    
    if (q) qbSum.andWhere('i.title LIKE :q', { q: `%${q}%` });
    if (type) qbSum.andWhere('i.type = :type', { type });
    if (state) qbSum.andWhere('i.state = :state', { state });
    if (priority) qbSum.andWhere('i.priority = :priority', { priority });
    
    const sums = await qbSum
      .select('COALESCE(SUM(i.estimated_hours), 0)', 'totalEstimated')
      .addSelect('COALESCE(SUM(i.actual_hours), 0)', 'totalActual')
      .getRawOne<{ totalEstimated: string; totalActual: string }>();
    
    const totalEstimated = sums ? parseFloat(sums.totalEstimated) : 0;
    const totalActual = sums ? parseFloat(sums.totalActual) : 0;

    return { 
      items, 
      page, 
      pageSize, 
      total, 
      totalEstimated, 
      totalActual 
    };
  }
}


