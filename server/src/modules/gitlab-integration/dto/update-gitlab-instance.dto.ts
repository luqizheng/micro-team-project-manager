// import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGitLabInstanceDto } from './create-gitlab-instance.dto';

/**
 * 更新GitLab实例DTO
 * 字段名与前端提交的数据结构保持一致
 */
export class UpdateGitLabInstanceDto {
  name?: string;
  url?: string; // 修改为 url 以匹配前端
  accessToken?: string; // 修改为 accessToken 以匹配前端
  webhookSecret?: string;
  type?: 'self_hosted' | 'gitlab_com'; // 修改为 type 以匹配前端
  isActive?: boolean;
  description?: string; // 添加 description 字段
  syncConfig?: string; // 添加 syncConfig 字段
  advancedConfig?: string; // 添加 advancedConfig 字段
}