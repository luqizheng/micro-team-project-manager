import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

/**
 * GitLab实例响应DTO
 */
export class GitLabInstanceResponseDto {
  @ApiProperty({
    description: '实例ID',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: '实例名称',
    example: '公司GitLab',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'GitLab实例基础URL',
    example: 'https://gitlab.example.com',
  })
  @Expose()
  baseUrl: string;

  @ApiPropertyOptional({
    description: 'Webhook签名密钥（仅显示前4位）',
    example: 'web****',
  })
  @Expose()
  @Transform(({ value }) => value ? `${value.substring(0, 4)}****` : null)
  webhookSecret?: string;

  @ApiProperty({
    description: '是否激活',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: '实例类型',
    enum: ['self_hosted', 'gitlab_com'],
    example: 'self_hosted',
  })
  @Expose()
  instanceType: 'self_hosted' | 'gitlab_com';

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
    description: '项目映射数量',
    example: 5,
  })
  @Expose()
  projectCount?: number;

  @ApiPropertyOptional({
    description: '激活的项目映射数量',
    example: 3,
  })
  @Expose()
  activeProjectCount?: number;

  @ApiPropertyOptional({
    description: '最后同步时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  lastSyncTime?: Date;

  @ApiPropertyOptional({
    description: '失败的同步数量',
    example: 0,
  })
  @Expose()
  failedSyncCount?: number;

  // 排除敏感信息
  @Exclude()
  apiToken: string;
}
