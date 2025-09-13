// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 权限检查DTO
 */
export class PermissionCheckDto {
  // @ApiProperty({
  //   description: '权限名称',
  //   example: 'gitlab:instance:create',
  // })
  permission!: string;
}

/**
 * 权限检查响应DTO
 */
export class PermissionCheckResponseDto {
  // @ApiProperty({
  //   description: '是否有权限',
  //   example: true,
  // })
  hasPermission!: boolean;

  // @ApiProperty({
  //   description: '权限名称',
  //   example: 'gitlab:instance:create',
  // })
  permission!: string;

  // @ApiProperty({
  //   description: '响应消息',
  //   example: '权限验证通过',
  // })
  message?: string;
}

/**
 * 用户权限信息DTO
 */
export class UserPermissionInfoDto {
  // @ApiProperty({
  //   description: '用户角色',
  //   example: 'admin',
  // })
  role!: string;

  // @ApiProperty({
  //   description: '权限列表',
  //   example: ['gitlab:instance:create', 'gitlab:instance:read'],
  // })
  permissions!: string[];

  // @ApiProperty({
  //   description: '可访问的实例数量',
  //   example: 5,
  // })
  accessibleInstances!: number;

  // @ApiProperty({
  //   description: '可访问的映射数量',
  //   example: 10,
  // })
  accessibleMappings!: number;

  // @ApiProperty({
  //   description: '是否可以同步',
  //   example: true,
  // })
  canSync!: boolean;
}

/**
 * 权限配置DTO
 */
export class PermissionConfigDto {
  // @ApiProperty({
  //   description: '是否启用权限控制',
  //   example: true,
  // })
  enabled!: boolean;

  // @ApiProperty({
  //   description: '是否启用细粒度权限',
  //   example: false,
  // })
  enableFineGrained!: boolean;

  // @ApiProperty({
  //   description: '默认策略',
  //   enum: ['allow', 'deny'],
  //   example: 'deny',
  // })
  defaultPolicy!: 'allow' | 'deny';

  // @ApiProperty({
  //   description: '缓存超时时间（秒）',
  //   example: 300,
  // })
  cacheTimeout!: number;
}

/**
 * 角色权限DTO
 */
export class RolePermissionDto {
  // @ApiProperty({
  //   description: '角色名称',
  //   example: 'admin',
  // })
  role!: string;

  // @ApiProperty({
  //   description: '权限列表',
  //   example: ['gitlab:instance:create', 'gitlab:instance:read'],
  // })
  permissions!: string[];

  // @ApiProperty({
  //   description: '是否可继承',
  //   example: true,
  // })
  inheritable!: boolean;

  // @ApiProperty({
  //   description: '父角色',
  //   example: 'user',
  // })
  parentRole?: string;
}

/**
 * 权限审计日志DTO
 */
export class PermissionAuditLogDto {
  // @ApiProperty({
  //   description: '用户ID',
  //   example: 'uuid-string',
  // })
  userId!: string;

  // @ApiProperty({
  //   description: '权限名称',
  //   example: 'gitlab:instance:create',
  // })
  permission!: string;

  // @ApiProperty({
  //   description: '检查结果',
  //   enum: ['granted', 'denied'],
  //   example: 'granted',
  // })
  result!: 'granted' | 'denied';

  // @ApiProperty({
  //   description: '请求路径',
  //   example: '/api/gitlab/instances',
  // })
  path!: string;

  // @ApiProperty({
  //   description: '请求方法',
  //   example: 'POST',
  // })
  method!: string;

  // @ApiProperty({
  //   description: '时间戳',
  //   example: '2024-01-01T00:00:00.000Z',
  // })
  timestamp!: string;
}