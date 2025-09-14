import { IsString, IsUrl, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建GitLab实例DTO
 * 字段名与前端提交的数据结构保持一致
 */
export class CreateGitLabInstanceDto {
  // @ApiProperty({
  //   description: '实例名称',
  //   example: '公司GitLab',
  //   minLength: 1,
  //   maxLength: 100,
  // })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  // @ApiProperty({
  //   description: 'GitLab实例基础URL',
  //   example: 'https://gitlab.example.com',
  // })
  // @IsUrl({
  //   protocols: ['http', 'https'],
  //   require_protocol: true,
  // })
  @IsString()
  url!: string; // 修改为 url 以匹配前端

  // @ApiProperty({
  //   description: 'API访问令牌',
  //   example: 'glpat-xxxxxxxxxxxxxxxxxxxx',
  //   minLength: 20,
  // })
  @IsString()
  @MinLength(20)
  accessToken!: string; // 修改为 accessToken 以匹配前端

  // @ApiPropertyOptional({
  //   description: 'Webhook签名密钥',
  //   example: 'webhook_secret_key',
  //   maxLength: 128,
  // })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  webhookSecret?: string;

  // @ApiPropertyOptional({
  //   description: '实例类型',
  //   enum: ['self_hosted', 'gitlab_com'],
  //   default: 'self_hosted',
  // })
  @IsOptional()
  @IsEnum(['self_hosted', 'gitlab_com'])
  type?: 'self_hosted' | 'gitlab_com'; // 修改为 type 以匹配前端

  // @ApiPropertyOptional({
  //   description: '是否激活',
  //   default: true,
  // })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // @ApiPropertyOptional({
  //   description: '实例描述',
  //   example: '公司内部GitLab服务器',
  //   maxLength: 500,
  // })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string; // 添加 description 字段

  // @ApiPropertyOptional({
  //   description: '同步配置',
  //   example: '{"syncUsers": true, "syncIssues": true}',
  // })
  @IsOptional()
  @IsString()
  syncConfig?: string; // 添加 syncConfig 字段

  // @ApiPropertyOptional({
  //   description: '高级配置',
  //   example: '{"apiTimeout": 30, "retryCount": 3}',
  // })
  @IsOptional()
  @IsString()
  advancedConfig?: string; // 添加 advancedConfig 字段
}