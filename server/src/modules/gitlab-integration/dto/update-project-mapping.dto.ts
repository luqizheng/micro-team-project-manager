import { PartialType } from '@nestjs/swagger';
import { CreateProjectMappingDto } from './create-project-mapping.dto';

/**
 * 更新项目映射DTO
 * 继承创建DTO，但所有字段都是可选的
 */
export class UpdateProjectMappingDto extends PartialType(CreateProjectMappingDto) {}
