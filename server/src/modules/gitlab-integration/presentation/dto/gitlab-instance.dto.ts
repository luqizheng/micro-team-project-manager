/**
 * GitLab实例相关DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsBoolean, IsEnum, MinLength, MaxLength } from 'class-validator';
import { InstanceType } from '../../core/enums';

/**
 * 创建GitLab实例DTO
 */
export class CreateGitLabInstanceDto {
  @ApiProperty({ 
    description: '实例名称',
    example: 'GitLab Production',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string= '';

  @ApiProperty({ 
    description: 'GitLab实例URL',
    example: 'https://gitlab.example.com',
  })
  @IsUrl()
  baseUrl: string= '';

  @ApiProperty({ 
    description: 'API Token',
    example: 'glpat-xxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  apiToken: string= '';

  @ApiPropertyOptional({ 
    description: 'Webhook密钥',
    example: 'webhook-secret-key',
  })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ 
    description: '是否激活',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: '实例类型',
    enum: InstanceType,
    example: InstanceType.SELF_HOSTED,
    default: InstanceType.SELF_HOSTED,
  })
  @IsOptional()
  @IsEnum(InstanceType)
  instanceType?: InstanceType;

  @ApiPropertyOptional({ 
    description: '是否测试连接',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  testConnection?: boolean;
}

/**
 * 更新GitLab实例DTO
 */
export class UpdateGitLabInstanceDto {
  @ApiPropertyOptional({ 
    description: '实例名称',
    example: 'GitLab Production Updated',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ 
    description: 'GitLab实例URL',
    example: 'https://gitlab.example.com',
  })
  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @ApiPropertyOptional({ 
    description: 'API Token',
    example: 'glpat-xxxxxxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  apiToken?: string;

  @ApiPropertyOptional({ 
    description: 'Webhook密钥',
    example: 'webhook-secret-key',
  })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ 
    description: '是否激活',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: '实例类型',
    enum: InstanceType,
    example: InstanceType.SELF_HOSTED,
  })
  @IsOptional()
  @IsEnum(InstanceType)
  instanceType?: InstanceType;
}

/**
 * GitLab实例响应DTO
 */
export class GitLabInstanceResponseDto {
  @ApiProperty({ 
    description: '实例ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string='';

  @ApiProperty({ 
    description: '实例名称',
    example: 'GitLab Production',
  })
  name: string='';

  @ApiProperty({ 
    description: 'GitLab实例URL',
    example: 'https://gitlab.example.com',
  })
  baseUrl: string='';

  @ApiProperty({ 
    description: '是否激活',
    example: true,
  })
  isActive: boolean=true;

  @ApiProperty({ 
    description: '实例类型',
    enum: InstanceType,
    example: InstanceType.SELF_HOSTED,
  })
  instanceType: InstanceType=InstanceType.SELF_HOSTED;

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

  @ApiProperty({ 
    description: 'API URL',
    example: 'https://gitlab.example.com/api/v4',
  })
  apiUrl: string='';

  @ApiProperty({ 
    description: 'Webhook URL',
    example: 'https://gitlab.example.com/api/v4/projects/:id/hooks',
  })
  webhookUrl: string='';

  @ApiProperty({ 
    description: '显示名称',
    example: 'GitLab Production (https://gitlab.example.com)',
  })
  displayName: string='';
}
