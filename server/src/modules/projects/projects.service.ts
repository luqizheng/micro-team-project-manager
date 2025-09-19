import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { MembershipEntity } from '../memberships/membership.entity';
import { UserEntity } from '../users/user.entity';
import { BoardsService } from '../boards/boards.service';
import { IssueStatesService } from '../issue-states/issue-states.service';
import { GitLabApiGitBeakerService } from '../gitlab-integration/services/gitlab-api-gitbeaker.service';
import { GitLabGroupMapping } from '../gitlab-integration/core/entities/gitlab-group-mapping.entity';
import { GitLabInstance } from '../gitlab-integration/core/entities/gitlab-instance.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepo: Repository<MembershipEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly boardsService: BoardsService,
    private readonly issueStatesService: IssueStatesService,
    private readonly gitlabApiService: GitLabApiGitBeakerService,
    @InjectRepository(GitLabGroupMapping)
    private readonly groupMappingRepo: Repository<GitLabGroupMapping>,
    @InjectRepository(GitLabInstance)
    private readonly instanceRepo: Repository<GitLabInstance>,
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
    const project = await this.repo.save(entity);
    
    // 创建默认看板
    try {
      await this.boardsService.createDefaultBoard(project.id);
    } catch (error) {
      console.error('Failed to create default board:', error);
      // 不抛出错误，因为项目创建成功，看板创建失败不应该影响项目创建
    }

    // 初始化默认的issues状态
    try {
      await this.issueStatesService.initializeDefaultStates(project.id);
    } catch (error) {
      console.error('Failed to initialize default issue states:', error);
      // 不抛出错误，因为项目创建成功，状态初始化失败不应该影响项目创建
    }
    
    return project;
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

  // 同步GitLab成员到项目
  async syncGitLabMembers(projectId: string): Promise<{
    total: number;
    added: number;
    skipped: number;
  }> {
    console.log('----------------------------------------','同步喀什')
    const project = await this.findOne(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // 找到分组映射
    const mapping = await this.groupMappingRepo.findOne({ where: { projectId } });
    if (!mapping) {
      throw new Error('GitLab group mapping not found');
    }

    // 找到GitLab实例
    const instance = await this.instanceRepo.findOne({ where: { id: mapping.gitlabInstanceId } });
    if (!instance) {
      throw new Error('GitLab instance not found');
    }

    // 拉取GitLab分组成员
    const gitlabMembers = await this.gitlabApiService.getGroupMembers(instance, String(mapping.gitlabGroupId));
    console.warn('----------------------------------------','gitlabMembers',gitlabMembers,mapping.gitlabGroupId)
    let added = 0;
    let skipped = 0;

    for (const gm of gitlabMembers) {
          // 以邮箱为准匹配已有用户；若无邮箱则尝试名称匹配
      const byEmail = gm.email ? await this.userRepo.findOne({ where: { email: gm.email } }) : null;
      const user = byEmail || await this.userRepo.findOne({ where: { name: gm.name } });

      if (!user) {
        // 不创建新用户，跳过（避免引入无密码账号）；也可改为创建逻辑 
        console.warn('----------------------------------------','不创建新用户，跳过') 
        skipped++;
        continue;
      }

      console.warn('----------------------------------------','user',user)

      // 已是成员则跳过
      const exists = await this.membershipRepo.findOne({ where: { projectId, userId: user.id } });
      if (exists) {
        console.warn('----------------------------------------','已是成员则跳过')
        skipped++;
        continue;
      }

      // 角色映射：Owner/ Maintainer -> project_manager，其余member
      const access = (gm as any).access_level as number | undefined;
      const role: 'member' | 'project_manager' = access && access >= 40 ? 'project_manager' : 'member';

      await this.addMember(projectId, user.id, role);
      added++;
    }

    return { total: gitlabMembers.length, added, skipped };
  }

  // 获取项目成员列表
  async getProjectMembers(projectId: string, options: { page: number; pageSize: number; q?: string }) {
    const { page, pageSize, q } = options;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.membershipRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .where('m.projectId = :projectId', { projectId });

    if (q) {
      queryBuilder.andWhere(
        '(u.name LIKE :q OR u.email LIKE :q)',
        { q: `%${q}%` }
      );
    }

    const [memberships, total] = await queryBuilder
      .orderBy('m.joinedAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: memberships.map(membership => ({
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        avatar: membership.user.avatar,
        role: membership.role,
        joinedAt: membership.joinedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  // 添加项目成员
  async addMember(projectId: string, userId: string, role: 'member' | 'project_manager') {
    // 检查项目是否存在
    const project = await this.findOne(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // 检查用户是否存在
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // 检查是否已经是成员
    const existingMembership = await this.membershipRepo.findOne({
      where: { projectId, userId }
    });
    if (existingMembership) {
      throw new Error('User is already a member of this project');
    }

    // 创建成员关系
    const membership = this.membershipRepo.create({
      projectId,
      userId,
      role,
    });

    return this.membershipRepo.save(membership);
  }

  // 更新项目成员角色
  async updateMember(projectId: string, userId: string, role: 'member' | 'project_manager') {
    const membership = await this.membershipRepo.findOne({
      where: { projectId, userId }
    });
    if (!membership) {
      throw new Error('Membership not found');
    }

    membership.role = role;
    return this.membershipRepo.save(membership);
  }

  // 移除项目成员
  async removeMember(projectId: string, userId: string) {
    const result = await this.membershipRepo.delete({ projectId, userId });
    if (result.affected === 0) {
      throw new Error('Membership not found');
    }
  }
}


