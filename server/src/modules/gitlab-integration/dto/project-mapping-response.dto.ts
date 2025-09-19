// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 项目映射响应DTO
 */
export class ProjectMappingResponseDto {
  // @ApiProperty({
  //   description: '映射ID',
  //   example: 'uuid-string',
  // })
  id!: string;

  // @ApiProperty({
  //   description: '项目管理工具项目ID',
  //   example: 'uuid-string',
  // })
  projectId!: string;

  // @ApiProperty({
  //   description: 'GitLab实例ID',
  //   example: 'uuid-string',
  // })
  gitlabInstanceId!: string;

  // @ApiProperty({
  //   description: 'GitLab分组ID',
  //   example: 123,
  // })
  gitlabGroupId!: number;

  // @ApiProperty({
  //   description: 'GitLab分组路径',
  //   example: 'group/subgroup',
  // })
  gitlabGroupPath!: string;

  // @ApiPropertyOptional({
  //   description: 'GitLab Webhook ID',
  //   example: 'uuid-string',
  // })
  webhookId?: string;

  // @ApiPropertyOptional({
  //   description: '同步配置',
  //   type: 'object',
  // })
  syncConfig?: any;

  // @ApiPropertyOptional({
  //   description: '字段映射配置',
  //   type: 'object',
  // })
  fieldMapping?: any;

  // @ApiProperty({
  //   description: '是否激�?,
  //   example: true,
  // })
  isActive!: boolean;

  // @ApiProperty({
  //   description: '创建时间',
  //   example: '2024-01-01T00:00:00.000Z',
  // })
  createdAt!: Date;

  // @ApiProperty({
  //   description: '更新时间',
  //   example: '2024-01-01T00:00:00.000Z',
  // })
  updatedAt!: Date;

  // @ApiPropertyOptional({
  //   description: '项目名称',
  //   example: 'My Project',
  // })
  projectName?: string;

  // @ApiPropertyOptional({
  //   description: 'GitLab实例名称',
  //   example: 'Company GitLab',
  // })
  gitlabInstanceName?: string;

  // @ApiPropertyOptional({
  //   description: 'GitLab分组URL',
  //   example: 'https://gitlab.example.com/groups/group/subgroup',
  // })
  gitlabGroupUrl?: string;

  // @ApiPropertyOptional({
  //   description: '同步状�?,
  //   example: 'success',
  // })
  syncStatus?: string;

  // @ApiPropertyOptional({
  //   description: '最后同步时�?,
  //   example: '2024-01-01T00:00:00.000Z',
  // })
  lastSyncAt?: Date;

  // @ApiPropertyOptional({
  //   description: '同步次数',
  //   example: 10,
  // })
  syncCount?: number;
}
