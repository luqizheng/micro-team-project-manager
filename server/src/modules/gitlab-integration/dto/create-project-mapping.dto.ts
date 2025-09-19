// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

/**
 * 创建项目映射DTO
 */
export class CreateProjectMappingDto {
  // @ApiProperty({
  //   description: '项目管理工具项目ID',
  //   example: 'uuid-string',
  // })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  // @ApiProperty({
  //   description: 'GitLab实例ID',
  //   example: 'uuid-string',
  // })
  @IsString()
  @IsNotEmpty()
  gitlabInstanceId!: string;

  // @ApiProperty({
  //   description: 'GitLab分组ID',
  //   example: 123,
  // })
  @IsNotEmpty()
  gitlabGroupId!: number;

  // @ApiProperty({
  //   description: 'GitLab分组路径',
  //   example: 'group/subgroup',
  // })
  @IsString()
  @IsNotEmpty()
  gitlabGroupPath!: string;

  // @ApiPropertyOptional({
  //   description: '同步配置',
  //   type: 'object',
  // })
  @IsOptional()
  syncConfig?: any;

  // @ApiPropertyOptional({
  //   description: '字段映射配置',
  //   type: 'object',
  // })
  @IsOptional()
  fieldMapping?: any;

  // @ApiPropertyOptional({
  //   description: '是否激�?,
  //   example: true,
  //   default: true,
  // })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
