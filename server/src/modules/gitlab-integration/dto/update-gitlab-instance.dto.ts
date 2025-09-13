import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGitLabInstanceDto } from './create-gitlab-instance.dto';

/**
 * 更新GitLab实例DTO
 * 继承创建DTO，但所有字段都是可选的
 */
export class UpdateGitLabInstanceDto extends PartialType(
  OmitType(CreateGitLabInstanceDto, ['apiToken'] as const)
) {
  // 更新时不允许修改API Token，需要单独的安全流程
}
