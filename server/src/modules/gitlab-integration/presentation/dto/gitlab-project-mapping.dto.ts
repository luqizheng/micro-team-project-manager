/**
 * GitLab项目映射相关DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, IsNumber, MinLength, MaxLength } from 'class-validator';

/**
 * 创建项目映射DTO
 */
export class CreateProjectMappingDto {
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
    description: 'GitLab项目ID',
    example: 123,
  })
  @IsNumber()
  gitlabProjectId: number=0;

  @ApiPropertyOptional({ 
    description: 'GitLab项目路径',
    example: 'group/project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  gitlabProjectPath?: string;

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
 * 更新项目映射DTO
 */
export class UpdateProjectMappingDto {
  @ApiPropertyOptional({ 
    description: 'GitLab项目ID',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  gitlabProjectId?: number;

  @ApiPropertyOptional({ 
    description: 'GitLab项目路径',
    example: 'group/project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  gitlabProjectPath?: string;

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
 * 项目映射响应DTO
 */
export class ProjectMappingResponseDto {
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
    description: 'GitLab项目ID',
    example: '123',
  })
  gitlabProjectId: string='0';

  @ApiPropertyOptional({ 
    description: 'GitLab项目路径',
    example: 'group/project',
  })
  gitlabProjectPath?: string;

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
