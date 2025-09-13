import { IsString, IsUrl, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建GitLab实例DTO
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
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  baseUrl!: string;

  // @ApiProperty({
  //   description: 'API访问令牌',
  //   example: 'glpat-xxxxxxxxxxxxxxxxxxxx',
  //   minLength: 20,
  // })
  @IsString()
  @MinLength(20)
  apiToken!: string;

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
  instanceType?: 'self_hosted' | 'gitlab_com';

  // @ApiPropertyOptional({
  //   description: '是否激活',
  //   default: true,
  // })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}