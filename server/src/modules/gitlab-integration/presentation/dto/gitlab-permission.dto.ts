/**
 * GitLab权限相关DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsEnum, MinLength, MaxLength } from 'class-validator';
import { GitLabPermissionLevel } from '../../core/enums';

/**
 * 创建权限DTO
 */
export class CreatePermissionDto {
  @ApiProperty({ 
    description: '用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'GitLab实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  instanceId: string;

  @ApiProperty({ 
    description: '权限级别',
    enum: GitLabPermissionLevel,
    example: GitLabPermissionLevel.READ,
  })
  @IsEnum(GitLabPermissionLevel)
  permissionLevel: GitLabPermissionLevel;

  @ApiPropertyOptional({ 
    description: '是否启用',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ 
    description: '备注',
    example: '管理员权限',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

/**
 * 更新权限DTO
 */
export class UpdatePermissionDto {
  @ApiPropertyOptional({ 
    description: '权限级别',
    enum: GitLabPermissionLevel,
    example: GitLabPermissionLevel.WRITE,
  })
  @IsOptional()
  @IsEnum(GitLabPermissionLevel)
  permissionLevel?: GitLabPermissionLevel;

  @ApiPropertyOptional({ 
    description: '是否启用',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ 
    description: '备注',
    example: '管理员权限',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

/**
 * 权限响应DTO
 */
export class PermissionResponseDto {
  @ApiProperty({ 
    description: '权限ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ 
    description: '用户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({ 
    description: 'GitLab实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  instanceId: string;

  @ApiProperty({ 
    description: '权限级别',
    enum: GitLabPermissionLevel,
    example: GitLabPermissionLevel.READ,
  })
  permissionLevel: GitLabPermissionLevel;

  @ApiProperty({ 
    description: '是否启用',
    example: true,
  })
  isEnabled: boolean;

  @ApiPropertyOptional({ 
    description: '备注',
    example: '管理员权限',
  })
  remarks?: string;

  @ApiProperty({ 
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ 
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
