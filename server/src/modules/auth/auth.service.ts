import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  private hash(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.passwordHash !== this.hash(password)) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    
    // 获取用户的所有角色（系统角色 + 项目角色）
    const roles = await this.users.getUserRoles(user.id);
    
    // JWT payload包含用户ID、邮箱和角色信息
    const payload = { 
      sub: user.id, 
      email: user.email,
      roles: roles
    };
    
    return { 
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        roles: roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } 
    };
  }

  async getProfile(userId: string) {
    const user = await this.users.findOne(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    
    return {
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, data: {
    name?: string;
    displayName?: string;
    email?: string;
    avatar?: string;
  }) {
    const user = await this.users.findOne(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查邮箱是否被其他用户使用
    if (data.email && data.email !== user.email) {
      const existingUser = await this.users.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('邮箱已被其他用户使用');
      }
    }

    return this.users.update(userId, data);
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findOne(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证当前密码
    if (user.passwordHash !== this.hash(currentPassword)) {
      throw new BadRequestException('当前密码不正确');
    }

    // 更新密码
    const passwordHash = this.hash(newPassword);
    return this.users.update(userId, { passwordHash });
  }
}


