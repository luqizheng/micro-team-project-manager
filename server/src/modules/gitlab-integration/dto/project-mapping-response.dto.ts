import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 项目映射响应DTO
 */
export class ProjectMappingResponseDto {
  @ApiProperty({
    description: '映射ID',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: '项目管理工具项目ID',
    example: 'uuid-string',
  })
  @Expose()
  projectId: string;

  @ApiProperty({
    description: 'GitLab实例ID',
    example: 'uuid-string',
  })
  @Expose()
  gitlabInstanceId: string;

  @ApiProperty({
    description: 'GitLab项目ID',
    example: 123,
  })
  @Expose()
  gitlabProjectId: number;

  @ApiProperty({
    description: 'GitLab项目路径',
    example: 'group/project-name',
  })
  @Expose()
  gitlabProjectPath: string;

  @ApiPropertyOptional({
    description: 'GitLab Webhook ID',
    example: 'webhook-id',
  })
  @Expose()
  webhookId?: string;

  @ApiProperty({
    description: '是否激活',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '项目名称',
    example: '项目管理工具项目',
  })
  @Expose()
  projectName?: string;

  @ApiPropertyOptional({
    description: 'GitLab实例名称',
    example: '公司GitLab',
  })
  @Expose()
  gitlabInstanceName?: string;

  @ApiPropertyOptional({
    description: 'GitLab项目URL',
    example: 'https://gitlab.example.com/group/project-name',
  })
  @Expose()
  gitlabProjectUrl?: string;

  @ApiPropertyOptional({
    description: '同步状态',
    enum: ['success', 'failed', 'in_progress'],
    example: 'success',
  })
  @Expose()
  syncStatus?: 'success' | 'failed' | 'in_progress';

  @ApiPropertyOptional({
    description: '最后同步时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  lastSyncAt?: Date;

  @ApiPropertyOptional({
    description: '同步次数',
    example: 5,
  })
  @Expose()
  syncCount?: number;
}
