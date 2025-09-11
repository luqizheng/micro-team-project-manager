import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const makeContext = (data: any) => ({
    switchToHttp: () => ({ getRequest: () => data }),
    getClass: () => ({}),
    getHandler: () => ({}),
  } as any);

  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const memberships = { findRole: jest.fn() } as any;
  const guard = new RolesGuard(reflector, memberships);

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.ADMIN_EMAILS = '';
  });

  it('allows when no roles required', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(undefined);
    const can = await guard.canActivate(makeContext({ user: { userId: 'u1' } }));
    expect(can).toBe(true);
  });

  it('allows admin email bypass', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['project_admin']);
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const can = await guard.canActivate(makeContext({ user: { userId: 'u1', email: 'admin@example.com' } }));
    expect(can).toBe(true);
  });

  it('throws on missing user', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['member']);
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(ForbiddenException);
  });

  it('throws on missing projectId', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['member']);
    await expect(guard.canActivate(makeContext({ user: { userId: 'u1' } }))).rejects.toThrow('projectId required');
  });

  it('denies when role insufficient', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['project_admin']);
    memberships.findRole.mockResolvedValue({ role: 'viewer' });
    await expect(
      guard.canActivate(makeContext({ user: { userId: 'u1' }, params: { projectId: 'p1' } })),
    ).rejects.toThrow('Insufficient role');
  });

  it('allows when role matches', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['member']);
    memberships.findRole.mockResolvedValue({ role: 'member' });
    const ok = await guard.canActivate(makeContext({ user: { userId: 'u1' }, params: { projectId: 'p1' } }));
    expect(ok).toBe(true);
  });
});
