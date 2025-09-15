import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueEntity, IssueType } from './issue.entity';
import { IssueStatesService } from '../issue-states/issue-states.service';
import { ProjectEntity } from '../projects/project.entity';
import { GitLabApiGitBeakerService } from '../gitlab-integration/services/gitlab-api-gitbeaker.service';
import { GitLabProjectMapping } from '../gitlab-integration/entities/gitlab-project-mapping.entity';
import { GitLabInstance } from '../gitlab-integration/entities/gitlab-instance.entity';

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @InjectRepository(IssueEntity)
    private readonly repo: Repository<IssueEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(GitLabProjectMapping)
    private readonly gitlabMappingRepo: Repository<GitLabProjectMapping>,
    @InjectRepository(GitLabInstance)
    private readonly gitlabInstanceRepo: Repository<GitLabInstance>,
    private readonly issueStatesService: IssueStatesService,
    private readonly gitlabApiService: GitLabApiGitBeakerService,
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
    
    // 创建本地Issue
    const issue = await this.repo.save(this.repo.create(data));
    
    // 尝试同步到GitLab
    try {
      await this.syncIssueToGitLab(issue, 'create');
    } catch (error: any) {
      this.logger.warn(`同步Issue到GitLab失败: ${error.message}`, {
        issueId: issue.id,
        issueKey: issue.key,
        error: error.stack,
      });
      // 不抛出错误，避免影响本地Issue创建
    }
    
    return issue;
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
    
    // 保存原始数据用于比较
    const originalData = { ...entity };
    
    Object.assign(entity, data);
    const updatedIssue = await this.repo.save(entity);
    
    // 尝试同步到GitLab
    try {
      await this.syncIssueToGitLab(updatedIssue, 'update', originalData);
    } catch (error: any) {
      this.logger.warn(`同步Issue更新到GitLab失败: ${error.message}`, {
        issueId: updatedIssue.id,
        issueKey: updatedIssue.key,
        error: error.stack,
      });
      // 不抛出错误，避免影响本地Issue更新
    }
    
    return updatedIssue;
  }

  async remove(id: string) {
    // 先获取Issue信息用于同步
    const issue = await this.findOne(id);
    if (!issue) {
      throw new Error('Issue not found');
    }
    
    // 删除本地Issue
    await this.repo.delete(id);
    
    // 尝试同步到GitLab
    try {
      await this.syncIssueToGitLab(issue, 'delete');
    } catch (error: any) {
      this.logger.warn(`同步Issue删除到GitLab失败: ${error.message}`, {
        issueId: issue.id,
        issueKey: issue.key,
        error: error.stack,
      });
      // 不抛出错误，避免影响本地Issue删除
    }
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

  /**
   * 同步Issue到GitLab
   * @param issue 要同步的Issue
   * @param action 操作类型：create, update, delete
   * @param originalData 原始数据（用于更新时比较）
   */
  private async syncIssueToGitLab(
    issue: IssueEntity, 
    action: 'create' | 'update' | 'delete',
    originalData?: Partial<IssueEntity>
  ): Promise<void> {
    try {
      // 查找项目映射
      const mapping = await this.findProjectMapping(issue.projectId);
      if (!mapping) {
        this.logger.debug(`项目 ${issue.projectId} 没有配置GitLab映射，跳过同步`);
        return;
      }

      // 获取GitLab实例
      const instance = await this.gitlabInstanceRepo.findOne({
        where: { id: mapping.gitlabInstanceId, isActive: true }
      });
      if (!instance) {
        this.logger.warn(`GitLab实例 ${mapping.gitlabInstanceId} 不存在或未激活`);
        return;
      }

      // 根据操作类型执行不同的同步逻辑
      switch (action) {
        case 'create':
          await this.createIssueInGitLab(instance, mapping, issue);
          break;
        case 'update':
          await this.updateIssueInGitLab(instance, mapping, issue, originalData);
          break;
        case 'delete':
          await this.deleteIssueInGitLab(instance, mapping, issue);
          break;
      }

    } catch (error: any) {
      this.logger.error(`同步Issue到GitLab失败: ${error.message}`, {
        issueId: issue.id,
        issueKey: issue.key,
        action,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 查找项目映射
   * @param projectId 项目ID
   * @returns 项目映射信息
   */
  private async findProjectMapping(projectId: string): Promise<GitLabProjectMapping | null> {
    return await this.gitlabMappingRepo.findOne({
      where: { 
        projectId,
        isActive: true 
      },
      relations: ['project', 'gitlabInstance']
    });
  }


  /**
   * 在GitLab中更新或创建Issue
   */
  private async updateIssueInGitLab(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    issue: IssueEntity,
    originalData?: Partial<IssueEntity>
  ): Promise<void> {
    try {
      // 检查是否有实际变更
      if (originalData && !this.hasSignificantChanges(issue, originalData)) {
        this.logger.debug(`Issue ${issue.key} 没有显著变更，跳过GitLab同步`);
        return;
      }

      // 从Issue Key中提取GitLab Issue IID
      const gitlabIssueIid = this.extractGitLabIssueIid(issue.key);
      
      // 如果无法提取IID，说明这是一个新的本地Issue，需要在GitLab中创建
      if (!gitlabIssueIid) {
        this.logger.log(`Issue ${issue.key} 没有GitLab IID，将在GitLab中创建新Issue`);
        await this.createIssueInGitLab(instance, mapping, issue);
        return;
      }

      // 检查GitLab Issue是否存在
      try {
        await this.gitlabApiService.getIssue(instance, mapping.gitlabProjectId, gitlabIssueIid);
      } catch (error: any) {
        // 如果Issue不存在（404错误），则创建新的Issue
        if (error.status === 404 || error.message?.includes('404')) {
          this.logger.log(`GitLab Issue ${gitlabIssueIid} 不存在，将在GitLab中创建新Issue`);
          await this.createIssueInGitLab(instance, mapping, issue);
          return;
        }
        // 其他错误继续抛出
        throw error;
      }

      // 准备更新数据
      const updateData: any = {};
      
      if (originalData?.title !== issue.title) {
        updateData.title = issue.title;
      }
      
      if (originalData?.description !== issue.description) {
        updateData.description = issue.description || '';
      }
      
      if (originalData?.state !== issue.state) {
        updateData.state = this.mapLocalStateToGitLab(issue.state);
      }
      
      if (originalData?.assigneeId !== issue.assigneeId) {
        updateData.assigneeIds = await this.getGitLabAssigneeIds(instance, issue.assigneeId);
      }
      
      if (originalData?.labels !== issue.labels) {
        updateData.labels = this.buildGitLabLabels(issue);
      }

      // 如果有变更，则更新GitLab Issue
      if (Object.keys(updateData).length > 0) {
        await this.gitlabApiService.updateIssue(
          instance,
          mapping.gitlabProjectId,
          gitlabIssueIid,
          updateData
        );

        this.logger.log(`成功在GitLab中更新Issue: ${gitlabIssueIid}`, {
          localIssueId: issue.id,
          localIssueKey: issue.key,
          gitlabIssueIid,
          updatedFields: Object.keys(updateData),
        });
      }

    } catch (error: any) {
      this.logger.error(`在GitLab中更新Issue失败: ${error.message}`, {
        localIssueId: issue.id,
        localIssueKey: issue.key,
        gitlabProjectId: mapping.gitlabProjectId,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 在GitLab中创建Issue
   */
  private async createIssueInGitLab(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    issue: IssueEntity
  ): Promise<void> {
    try {
      // 准备创建数据
      const createData = {
        title: issue.title,
        description: issue.description || '',
        assigneeIds: await this.getGitLabAssigneeIds(instance, issue.assigneeId),
        labels: this.buildGitLabLabels(issue),
      };

      // 在GitLab中创建Issue
      const gitlabIssue = await this.gitlabApiService.createIssue(
        instance,
        mapping.gitlabProjectId,
        createData.title,
        createData.description,
        createData.assigneeIds,
        createData.labels
      );

      // 更新本地Issue的Key，包含GitLab Issue IID
      const newIssueKey = `${mapping.project?.key || 'PROJ'}-${gitlabIssue.iid}`;
      await this.repo.update(issue.id, { key: newIssueKey });

      this.logger.log(`成功在GitLab中创建Issue: ${gitlabIssue.iid}`, {
        localIssueId: issue.id,
        oldIssueKey: issue.key,
        newIssueKey,
        gitlabIssueIid: gitlabIssue.iid,
        gitlabProjectId: mapping.gitlabProjectId,
      });

    } catch (error: any) {
      this.logger.error(`在GitLab中创建Issue失败: ${error.message}`, {
        localIssueId: issue.id,
        localIssueKey: issue.key,
        gitlabProjectId: mapping.gitlabProjectId,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 在GitLab中删除Issue
   */
  private async deleteIssueInGitLab(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    issue: IssueEntity
  ): Promise<void> {
    try {
      // 从Issue Key中提取GitLab Issue IID
      const gitlabIssueIid = this.extractGitLabIssueIid(issue.key);
      if (!gitlabIssueIid) {
        this.logger.warn(`无法从Issue Key ${issue.key} 中提取GitLab Issue IID`);
        return;
      }

      // 关闭GitLab Issue而不是删除（GitLab不支持删除Issue）
      await this.gitlabApiService.updateIssue(
        instance,
        mapping.gitlabProjectId,
        gitlabIssueIid,
        { state: 'closed' }
      );

      this.logger.log(`成功在GitLab中关闭Issue: ${gitlabIssueIid}`, {
        localIssueId: issue.id,
        localIssueKey: issue.key,
        gitlabIssueIid,
      });

    } catch (error: any) {
      this.logger.error(`在GitLab中删除Issue失败: ${error.message}`, {
        localIssueId: issue.id,
        localIssueKey: issue.key,
        gitlabProjectId: mapping.gitlabProjectId,
        error: error.stack,
      });
      throw error;
    }
  }

  /**
   * 检查Issue是否有显著变更
   */
  private hasSignificantChanges(issue: IssueEntity, originalData: Partial<IssueEntity>): boolean {
    const significantFields: (keyof IssueEntity)[] = ['title', 'description', 'state', 'assigneeId', 'labels'];
    return significantFields.some(field => issue[field] !== originalData[field]);
  }

  /**
   * 从Issue Key中提取GitLab Issue IID
   * 格式：PROJ-123 -> 123
   */
  private extractGitLabIssueIid(issueKey: string): number | null {
    const match = issueKey.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * 构建GitLab标签数组
   */
  private buildGitLabLabels(issue: IssueEntity): string[] {
    const labels = [];
    
    if (issue.priority) {
      labels.push(`priority:${issue.priority}`);
    }
    
    if (issue.severity) {
      labels.push(`severity:${issue.severity}`);
    }
    
    if (issue.type) {
      labels.push(`type:${issue.type}`);
    }
    
    if (issue.labels && Array.isArray(issue.labels)) {
      labels.push(...issue.labels);
    }
    
    return labels;
  }

  /**
   * 获取GitLab用户ID列表
   */
  private async getGitLabAssigneeIds(instance: GitLabInstance, assigneeId?: string): Promise<number[] | undefined> {
    if (!assigneeId) return undefined;
    
    try {
      // 这里需要根据本地用户ID查找对应的GitLab用户ID
      // 实际实现中需要维护用户映射关系
      // 暂时返回空数组，避免错误
      this.logger.debug(`需要实现用户ID映射: ${assigneeId}`);
      return undefined;
    } catch (error: any) {
      this.logger.warn(`获取GitLab用户ID失败: ${error.message}`);
      return undefined;
    }
  }

  /**
   * 映射本地状态到GitLab状态
   */
  private mapLocalStateToGitLab(localState: string): 'opened' | 'closed' {
    const closedStates = ['done', 'closed', 'cancelled', 'rejected'];
    return closedStates.includes(localState) ? 'closed' : 'opened';
  }

  /**
   * 同步单个 Issue 到 GitLab
   */
  async syncToGitLab(issueId: string, projectId: string): Promise<{ success: boolean; message: string; gitlabIssueId?: number }> {
    try {
      this.logger.log(`开始同步 Issue 到 GitLab: ${issueId}`);

      // 1. 获取 Issue 信息
      const issue = await this.findOne(issueId);
      if (!issue) {
        return { success: false, message: 'Issue 不存在' };
      }

      // 2. 获取项目信息
      const project = await this.projectRepo.findOne({ where: { id: projectId } });
      if (!project) {
        return { success: false, message: '项目不存在' };
      }

      // 3. 查找 GitLab 项目映射
      const mapping = await this.gitlabMappingRepo.findOne({
        where: { projectId: projectId },
        relations: ['gitlabInstance']
      });

      if (!mapping) {
        return { success: false, message: '项目未配置 GitLab 映射' };
      }

      // 4. 获取 GitLab 实例
      const instance = mapping.gitlabInstance;
      if (!instance || !instance.isActive) {
        return { success: false, message: 'GitLab 实例未激活' };
      }

      // 5. 构建 GitLab Issue 数据
      const gitlabIssueData = {
        title: issue.title,
        description: issue.description || '',
        labels: this.buildGitLabLabels(issue),
        assignee_ids: await this.getGitLabAssigneeIds(instance, issue.assigneeId),
        state_event: this.mapLocalStateToGitLab(issue.state),
        due_date: issue.dueAt ? issue.dueAt.toISOString().split('T')[0] : undefined,
        weight: issue.storyPoints || undefined,
      };

      // 6. 检查是否已存在 GitLab Issue
      let gitlabIssueId: number | undefined;
      if (issue.key) {
        const iid = this.extractGitLabIssueIid(issue.key);
        if (iid) {
          // 更新现有 Issue
          try {
            await this.gitlabApiService.updateIssue(
              instance,
              mapping.gitlabProjectId,
              iid,
              {
                title: gitlabIssueData.title,
                description: gitlabIssueData.description,
                state: gitlabIssueData.state_event,
                assigneeIds: gitlabIssueData.assignee_ids,
                labels: gitlabIssueData.labels,
              }
            );
            gitlabIssueId = iid;
            this.logger.log(`更新 GitLab Issue 成功: ${iid}`);
          } catch (error: any) {
            this.logger.warn(`更新 GitLab Issue 失败: ${error.message}`);
            // 如果更新失败，尝试创建新的
          }
        }
      }

      // 7. 如果不存在或更新失败，创建新的 GitLab Issue
      if (!gitlabIssueId) {
        try {
          const createdIssue = await this.gitlabApiService.createIssue(
            instance,
            mapping.gitlabProjectId,
            gitlabIssueData.title,
            gitlabIssueData.description,
            gitlabIssueData.assignee_ids,
            gitlabIssueData.labels
          );
          gitlabIssueId = createdIssue.iid;
          this.logger.log(`创建 GitLab Issue 成功: ${gitlabIssueId}`);

          // 更新本地 Issue 的 key
          const newKey = `${project.key}-${gitlabIssueId}`;
          await this.update(issueId, { key: newKey });
        } catch (error: any) {
          this.logger.error(`创建 GitLab Issue 失败: ${error.message}`);
          return { success: false, message: `创建 GitLab Issue 失败: ${error.message}` };
        }
      }

      return {
        success: true,
        message: '同步到 GitLab 成功',
        gitlabIssueId: gitlabIssueId
      };

    } catch (error: any) {
      this.logger.error(`同步 Issue 到 GitLab 失败: ${error.message}`, error.stack);
      return { success: false, message: `同步失败: ${error.message}` };
    }
  }
}


