import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, MinLength, MaxLength } from 'class-validator';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建分组映射DTO
 */
export class CreateGroupMappingDto {
  // @ApiProperty({
  //   description: 'GitLab实例ID',
  //   example: 'uuid-string',
  // })
  @IsString()
  gitlabInstanceId!: string;

  // @ApiProperty({
  //   description: 'GitLab分组ID',
  //   example: 123,
  // })
  @IsNumber()
  gitlabGroupId!: number;

  // @ApiProperty({
  //   description: 'GitLab分组路径',
  //   example: 'group/subgroup',
  //   minLength: 1,
  //   maxLength: 500,
  // })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  gitlabGroupPath!: string;

  // @ApiPropertyOptional({
  //   description: '是否激�?,
  //   default: true,
  // })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
