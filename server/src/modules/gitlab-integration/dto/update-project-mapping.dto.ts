// import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectMappingDto } from './create-project-mapping.dto';

/**
 * 更新项目映射DTO
 */
export class UpdateProjectMappingDto {
  gitlabProjectId?: number;
  gitlabProjectPath?: string;
  webhookId?: number;
  isActive?: boolean;
  syncConfig?: any;
  fieldMapping?: any;
}