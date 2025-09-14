/**
 * GitLab同步相关DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { GitLabSyncStatus, GitLabSyncType } from '../../core/enums';

/**
 * 同步配置DTO
 */
export class SyncConfigDto {
  @ApiProperty({ 
    description: 'GitLab实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  instanceId?: string;

  @ApiPropertyOptional({ 
    description: '同步类型',
    enum: GitLabSyncType,
    example: GitLabSyncType.FULL,
    default: GitLabSyncType.FULL,
  })
  @IsOptional()
  @IsEnum(GitLabSyncType)
  syncType?: GitLabSyncType;

  @ApiPropertyOptional({ 
    description: '是否强制同步',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceSync?: boolean;

  @ApiPropertyOptional({ 
    description: '同步配置',
    example: { 
      projects: true, 
      issues: true, 
      mergeRequests: true, 
      pipelines: false 
    },
  })
  @IsOptional()
  syncOptions?: {
    projects?: boolean;
    issues?: boolean;
    mergeRequests?: boolean;
    pipelines?: boolean;
    commits?: boolean;
    notes?: boolean;
  };
}

/**
 * 同步状态响应DTO
 */
export class SyncStatusResponseDto {
  @ApiProperty({ 
    description: '同步ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id?: string;

  @ApiProperty({ 
    description: 'GitLab实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  instanceId?: string;

  @ApiProperty({ 
    description: '同步状态',
    enum: GitLabSyncStatus,
    example: GitLabSyncStatus.RUNNING,
  })
  status: GitLabSyncStatus;

  @ApiProperty({ 
    description: '同步类型',
    enum: GitLabSyncType,
    example: GitLabSyncType.FULL,
  })
  syncType: GitLabSyncType;

  @ApiProperty({ 
    description: '开始时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  startedAt?: Date;

  @ApiPropertyOptional({ 
    description: '结束时间',
    example: '2024-01-01T01:00:00.000Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({ 
    description: '错误信息',
    example: '连接超时',
  })
  errorMessage?: string;

  @ApiProperty({ 
    description: '同步统计',
    example: {
      totalItems: 100,
      processedItems: 50,
      successItems: 45,
      failedItems: 5,
    },
  })
  statistics?: {
    totalItems: number;
    processedItems: number;
    successItems: number;
    failedItems: number;
  };

  @ApiProperty({ 
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({ 
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt?: Date;
}

/**
 * 同步结果DTO
 */
export class SyncResultDto {
  @ApiProperty({ 
    description: '是否成功',
    example: true,
  })
  success: boolean=false;

  @ApiProperty({ 
    description: '同步ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  syncId?: string;

  @ApiProperty({ 
    description: '消息',
    example: '同步启动成功',
  })
  message?: string;

  @ApiPropertyOptional({ 
    description: '错误信息',
    example: '连接失败',
  })
  error?: string;
}
