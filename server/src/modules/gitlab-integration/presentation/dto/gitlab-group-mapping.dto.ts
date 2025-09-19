/**
 * GitLab分组映射相关DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber, MinLength, MaxLength } from 'class-validator';

/**
 * 创建分组映射DTO
 */
export class CreateGroupMappingDto {
  @ApiProperty({ 
    description: '项目ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  projectId: string='';

  @ApiProperty({ 
    description: 'GitLab实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  instanceId: string='';

  @ApiProperty({ 
    description: 'GitLab分组ID',
    example: 123,
  })
  @IsNumber()
  gitlabGroupId: number=0;

  @ApiPropertyOptional({ 
    description: 'GitLab分组路径',
    example: 'group/subgroup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  gitlabGroupPath?: string;

  @ApiPropertyOptional({ 
    description: '是否启用同步',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional({ 
    description: '是否同步Issues',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  syncIssues?: boolean;

  @ApiPropertyOptional({ 
    description: '是否同步合并请求',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  syncMergeRequests?: boolean;
}

/**
 * 更新分组映射DTO
 */
export class UpdateGroupMappingDto {
  @ApiPropertyOptional({ 
    description: 'GitLab分组ID',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  gitlabGroupId?: number;

  @ApiPropertyOptional({ 
    description: 'GitLab分组路径',
    example: 'group/subgroup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  gitlabGroupPath?: string;

  @ApiPropertyOptional({ 
    description: '是否启用同步',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional({ 
    description: '同步配置',
    example: { issues: true, mergeRequests: true, pipelines: false },
  })
  @IsOptional()
  syncConfig?: {
    issues?: boolean;
    mergeRequests?: boolean;
    pipelines?: boolean;
    commits?: boolean;
    notes?: boolean;
  };
}

/**
 * 分组映射响应DTO
 */
export class GroupMappingResponseDto {
  @ApiProperty({ 
    description: '映射ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string='';

  @ApiProperty({ 
    description: '项目ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string='';

  @ApiProperty({ 
    description: 'GitLab实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  instanceId: string='';

  @ApiProperty({ 
    description: 'GitLab分组ID',
    example: '123',
  })
  gitlabGroupId: string='0';

  @ApiPropertyOptional({ 
    description: 'GitLab分组路径',
    example: 'group/subgroup',
  })
  gitlabGroupPath?: string;

  @ApiProperty({ 
    description: '是否启用同步',
    example: true,
  })
  syncEnabled: boolean=true;

  @ApiPropertyOptional({ 
    description: '同步配置',
    example: { issues: true, mergeRequests: true, pipelines: false },
  })
  syncConfig?: {
    issues?: boolean;
    mergeRequests?: boolean;
    pipelines?: boolean;
    commits?: boolean;
    notes?: boolean;
  };

  @ApiProperty({ 
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date=new Date();

  @ApiProperty({ 
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date=new Date();
}
