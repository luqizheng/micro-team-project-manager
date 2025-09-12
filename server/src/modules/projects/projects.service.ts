import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { MembershipEntity } from '../memberships/membership.entity';
import { UserEntity } from '../users/user.entity';
import { BoardsService } from '../boards/boards.service';

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


