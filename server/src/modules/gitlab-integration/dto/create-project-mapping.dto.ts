import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, MinLength, MaxLength } from 'class-validator';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建项目映射DTO
 */
export class CreateProjectMappingDto {
  // @ApiProperty({
  //   description: 'GitLab实例ID',
  //   example: 'uuid-string',
  // })
  @IsString()
  gitlabInstanceId!: string;

  // @ApiProperty({
  //   description: 'GitLab项目ID',
  //   example: 123,
  // })
  @IsNumber()
  gitlabProjectId!: number;

  // @ApiProperty({
  //   description: 'GitLab项目路径',
  //   example: 'group/project',
  //   minLength: 1,
  //   maxLength: 500,
  // })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  gitlabProjectPath!: string;

  // @ApiPropertyOptional({
  //   description: '同步配置',
  //   type: 'object',
  // })
  @IsOptional()
  @IsObject()
  syncConfig?: any;

  // @ApiPropertyOptional({
  //   description: '字段映射配置',
  //   type: 'object',
  // })
  @IsOptional()
  @IsObject()
  fieldMapping?: any;

  // @ApiPropertyOptional({
  //   description: '是否激活',
  //   default: true,
  // })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}