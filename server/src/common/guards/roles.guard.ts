import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { MembershipsService } from '../../modules/memberships/memberships.service';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector, 
    private memberships: MembershipsService,
    private users: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { userId: string; email?: string } | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    // 获取用户的所有角色（系统角色 + 项目角色）
    const userRoles = await this.users.getUserRoles(user.userId);
    
    // 检查是否有系统管理员角色
    if (userRoles.includes('admin')) {
      return true;
    }

    // 检查系统级角色
    const hasSystemRole = required.some(role => userRoles.includes(role));
    if (hasSystemRole) {
      return true;
    }

    // 对于需要项目角色的操作，检查项目成员关系
    const projectId = req?.params?.projectId || req?.body?.projectId || req?.query?.projectId;
    if (projectId) {
      const membership = await this.memberships.findRole(projectId, user.userId);
      const projectRole = (membership?.role || 'viewer') as Role;
      if (required.includes(projectRole) || (projectRole === 'project_admin' && required.includes('member'))) {
        return true;
      }
    }

    throw new ForbiddenException('Insufficient role');
  }
}


