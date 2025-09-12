import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const payload = { sub: user.id, email: user.email };
    
    // 获取用户的所有角色（系统角色 + 项目角色）
    const roles = await this.users.getUserRoles(user.id);
    
    return { 
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        status: user.status,
        roles: roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } 
    };
  }
}


