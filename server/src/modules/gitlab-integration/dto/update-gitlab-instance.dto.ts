import { IsString, IsUrl, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
// import { PartialType, OmitType } from '@nestjs/mapped-types';
// import { CreateGitLabInstanceDto } from './create-gitlab-instance.dto';

/**
 * 更新GitLab实例DTO
 * 字段名与前端提交的数据结构保持一�?
 */
export class UpdateGitLabInstanceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  url?: string; // 修改�?url 以匹配前�?

  @IsOptional()
  @IsString()
  @MinLength(20)
  accessToken?: string; // 修改�?accessToken 以匹配前�?

  @IsOptional()
  @IsString()
  @MaxLength(128)
  webhookSecret?: string;

  @IsOptional()
  @IsEnum(['self_hosted', 'gitlab_com'])
  type?: 'self_hosted' | 'gitlab_com'; // 修改�?type 以匹配前�?

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string; // 添加 description 字段

  @IsOptional()
  @IsString()
  syncConfig?: string; // 添加 syncConfig 字段

  @IsOptional()
  @IsString()
  advancedConfig?: string; // 添加 advancedConfig 字段
}
