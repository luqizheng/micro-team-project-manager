import { IsString, IsInt, IsOptional, IsBoolean, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建项目映射DTO
 */
export class CreateProjectMappingDto {
  @ApiProperty({
    description: 'GitLab实例ID',
    example: 'uuid-string',
  })
  @IsString()
  @IsUUID()
  gitlabInstanceId: string;

  @ApiProperty({
    description: 'GitLab项目ID',
    example: 123,
  })
  @IsInt()
  gitlabProjectId: number;

  @ApiProperty({
    description: 'GitLab项目路径',
    example: 'group/project-name',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  gitlabProjectPath: string;

  @ApiPropertyOptional({
    description: 'GitLab Webhook ID',
    example: 'webhook-id',
  })
  @IsOptional()
  @IsString()
  webhookId?: string;

  @ApiPropertyOptional({
    description: '是否激活',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
