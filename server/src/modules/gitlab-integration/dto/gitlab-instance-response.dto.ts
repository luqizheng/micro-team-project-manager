// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * GitLab实例响应DTO
 */
export class GitLabInstanceResponseDto {
  // @ApiProperty({
  //   description: '实例ID',
  //   example: 'uuid-string',
  // })
  id!: string;

  // @ApiProperty({
  //   description: '实例名称',
  //   example: '公司GitLab',
  // })
  name!: string;

  // @ApiProperty({
  //   description: 'GitLab实例基础URL',
  //   example: 'https://gitlab.example.com',
  // })
  url!: string; // 修改�?url 以匹配前�?

  // @ApiPropertyOptional({
  //   description: 'API访问令牌（脱敏）',
  //   example: 'glpat-****',
  // })
  accessToken?: string; // 修改�?accessToken 以匹配前�?

  // @ApiPropertyOptional({
  //   description: 'Webhook签名密钥（脱敏）',
  //   example: 'webh****',
  // })
  webhookSecret?: string;

  // @ApiProperty({
  //   description: '是否激�?,
  //   example: true,
  // })
  isActive!: boolean;

  // @ApiProperty({
  //   description: '实例类型',
  //   enum: ['self_hosted', 'gitlab_com'],
  //   example: 'self_hosted',
  // })
  type!: 'self_hosted' | 'gitlab_com'; // 修改�?type 以匹配前�?

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
  //   description: '项目映射数量',
  //   example: 5,
  // })
  projectMappingCount?: number;

  // @ApiPropertyOptional({
  //   description: '事件日志数量',
  //   example: 100,
  // })
  eventLogCount?: number;

  // @ApiPropertyOptional({
  //   description: '用户映射数量',
  //   example: 20,
  // })
  userMappingCount?: number;

  // @ApiPropertyOptional({
  //   description: '最后同步时�?,
  //   example: '2024-01-01T00:00:00.000Z',
  // })
  lastSyncAt?: Date;

  // @ApiPropertyOptional({
  //   description: '同步状�?,
  //   example: 'success',
  // })
  syncStatus?: string;

  // @ApiPropertyOptional({
  //   description: '连接状�?,
  //   example: 'connected',
  // })
  connectionStatus?: string;


  activeProjectCount:number=0;


  lastSyncTime?:Date


  failedSyncCount:number=0

}
