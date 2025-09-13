import { IsString, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 权限检查请求DTO
 */
export class CheckPermissionDto {
  @ApiProperty({ description: '权限标识', example: 'read:gitlab_instance' })
  @IsString()
  permission: string;

  @ApiPropertyOptional({ description: '实例ID', example: 'instance-123' })
  @IsOptional()
  @IsString()
  instanceId?: string;

  @ApiPropertyOptional({ description: '项目ID', example: 'project-456' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '映射ID', example: 'mapping-789' })
  @IsOptional()
  @IsString()
  mappingId?: string;
}

/**
 * 权限检查响应DTO
 */
export class PermissionCheckResponseDto {
  @ApiProperty({ description: '是否有权限', example: true })
  @IsBoolean()
  hasPermission: boolean;

  @ApiProperty({ description: '权限标识', example: 'read:gitlab_instance' })
  @IsString()
  permission: string;

  @ApiPropertyOptional({ description: '错误信息' })
  @IsOptional()
  @IsString()
  message?: string;
}

/**
 * 用户权限摘要DTO
 */
export class UserPermissionSummaryDto {
  @ApiProperty({ description: '用户角色', example: 'system_admin' })
  @IsString()
  role: string;

  @ApiProperty({ description: '权限列表', example: ['read:gitlab_instance', 'create:gitlab_instance'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ description: '可访问的实例数量', example: 5 })
  @IsNumber()
  accessibleInstances: number;

  @ApiProperty({ description: '可访问的映射数量', example: 10 })
  @IsNumber()
  accessibleMappings: number;

  @ApiProperty({ description: '是否可以执行同步', example: true })
  @IsBoolean()
  canSync: boolean;
}

/**
 * 权限配置DTO
 */
export class PermissionConfigDto {
  @ApiProperty({ description: '是否启用权限检查', example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: '是否启用细粒度权限', example: false })
  @IsBoolean()
  enableFineGrained: boolean;

  @ApiProperty({ description: '默认权限策略', example: 'deny' })
  @IsString()
  defaultPolicy: 'allow' | 'deny';

  @ApiProperty({ description: '权限缓存时间（秒）', example: 300 })
  @IsNumber()
  cacheTimeout: number;
}

/**
 * 角色权限映射DTO
 */
export class RolePermissionMappingDto {
  @ApiProperty({ description: '角色名称', example: 'system_admin' })
  @IsString()
  role: string;

  @ApiProperty({ description: '权限列表', example: ['read:gitlab_instance', 'create:gitlab_instance'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ description: '是否可继承', example: true })
  @IsBoolean()
  inheritable: boolean;

  @ApiPropertyOptional({ description: '父角色', example: 'project_admin' })
  @IsOptional()
  @IsString()
  parentRole?: string;
}

/**
 * 权限审计日志DTO
 */
export class PermissionAuditLogDto {
  @ApiProperty({ description: '用户ID', example: 'user-123' })
  @IsString()
  userId: string;

  @ApiProperty({ description: '权限标识', example: 'read:gitlab_instance' })
  @IsString()
  permission: string;

  @ApiProperty({ description: '操作结果', example: 'granted' })
  @IsString()
  result: 'granted' | 'denied';

  @ApiProperty({ description: '请求路径', example: '/gitlab/instances' })
  @IsString()
  path: string;

  @ApiProperty({ description: '请求方法', example: 'GET' })
  @IsString()
  method: string;

  @ApiProperty({ description: '时间戳', example: '2024-01-01T00:00:00Z' })
  @IsString()
  timestamp: string;

  @ApiPropertyOptional({ description: '上下文信息' })
  @IsOptional()
  context?: Record<string, any>;
}
