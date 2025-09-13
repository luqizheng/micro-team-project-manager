// import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGitLabInstanceDto } from './create-gitlab-instance.dto';

/**
 * 更新GitLab实例DTO
 */
export class UpdateGitLabInstanceDto {
  name?: string;
  baseUrl?: string;
  webhookSecret?: string;
  instanceType?: 'self_hosted' | 'gitlab_com';
  isActive?: boolean;
}