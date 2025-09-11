import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { MembershipsService } from '../../modules/memberships/memberships.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private memberships: MembershipsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { userId: string; email?: string } | undefined;
    if (!user) throw new ForbiddenException('Unauthorized');

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (user.email && adminEmails.includes(user.email)) {
      return true;
    }

    const projectId = req?.params?.projectId || req?.body?.projectId || req?.query?.projectId;
    if (!projectId) throw new ForbiddenException('projectId required for role verification');

    const membership = await this.memberships.findRole(projectId, user.userId);
    const role = (membership?.role || 'viewer') as Role;
    if (!required.includes(role) && !(role === 'project_admin' && required.includes('member'))) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}


