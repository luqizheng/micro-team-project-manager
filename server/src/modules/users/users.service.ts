import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserEntity } from './user.entity';
import { MembershipEntity } from '../memberships/membership.entity';
import { createHash } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>,
    @InjectRepository(MembershipEntity) private readonly membershipRepo: Repository<MembershipEntity>
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  createBasic(data: Partial<UserEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async getUserMemberships(userId: string) {
    return this.membershipRepo.find({ where: { userId } });
  }

  async getUserRoles(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) return [];

    const memberships = await this.getUserMemberships(userId);
    const projectRoles = memberships.map(m => m.role);
    const systemRoles = user.systemRoles || [];
    
    return [...systemRoles, ...projectRoles];
  }

  private hash(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  async findAll(options: {
    page: number;
    pageSize: number;
    q?: string;
    status?: string;
  }) {
    const { page, pageSize, q, status } = options;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.repo.createQueryBuilder('user');

    if (q) {
      queryBuilder.andWhere(
        '(user.name LIKE :q OR user.email LIKE :q)',
        { q: `%${q}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const memberships = await this.getUserMemberships(id);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      status: user.status,
      systemRoles: user.systemRoles || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      memberships: memberships.map(m => ({
        id: m.id,
        projectId: m.projectId,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    avatar?: string;
    status?: string;
    systemRoles?: string[];
  }) {
    // 检查邮箱是否已存在
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('邮箱已存在');
    }

    const user = this.repo.create({
      email: data.email,
      name: data.name,
      passwordHash: this.hash(data.password),
      avatar: data.avatar,
      status: data.status || 'active',
      systemRoles: data.systemRoles || [],
    });

    const savedUser = await this.repo.save(user);
    
    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      avatar: savedUser.avatar,
      status: savedUser.status,
      systemRoles: savedUser.systemRoles,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }

  async update(id: string, data: {
    name?: string;
    email?: string;
    avatar?: string;
    status?: string;
    password?: string;
    systemRoles?: string[];
  }) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新邮箱，检查是否已存在
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException('邮箱已存在');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password !== undefined) updateData.passwordHash = this.hash(data.password);
    if (data.systemRoles !== undefined) updateData.systemRoles = data.systemRoles;

    await this.repo.update(id, updateData);
    
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 删除用户的所有成员关系
    await this.membershipRepo.delete({ userId: id });
    
    // 删除用户
    await this.repo.delete(id);
    
    return { message: '用户删除成功' };
  }

  async updateStatus(id: string, status: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.repo.update(id, { status });
    
    return this.findOne(id);
  }

  async updatePassword(id: string, password: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 生成密码哈希
    const passwordHash = createHash('sha256').update(password).digest('hex');

    await this.repo.update(id, { passwordHash });
    
    return { message: '密码修改成功' };
  }
}


