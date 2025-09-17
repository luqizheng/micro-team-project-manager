import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HierarchyService, MoveEntityDto, EntityType } from './hierarchy.service';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

class MoveEntityRequestDto {
  @IsEnum(['requirement', 'subsystem', 'feature_module', 'task', 'bug'])
  entityType!: EntityType;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @IsEnum(['requirement', 'subsystem', 'feature_module'])
  newParentType?: 'requirement' | 'subsystem' | 'feature_module';

  @IsOptional()
  @IsUUID()
  newParentId?: string;
}

@Controller('projects/:projectId/hierarchy')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get()
  @Roles('admin', 'project_manager', 'member')
  async getHierarchy(@Param('projectId') projectId: string) {
    return this.hierarchyService.getHierarchy(projectId);
  }

  @Post('move')
  @Roles('admin', 'project_manager')
  async moveEntity(
    @Param('projectId') projectId: string,
    @Body() dto: MoveEntityRequestDto,
  ) {
    await this.hierarchyService.moveEntity(dto);
    return { message: '移动成功' };
  }

  @Get('children/:entityType/:entityId')
  @Roles('admin', 'project_manager', 'member')
  async getChildren(
    @Param('projectId') projectId: string,
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.hierarchyService.getChildren(entityType, entityId);
  }

  @Get('parents/:entityType/:entityId')
  @Roles('admin', 'project_manager', 'member')
  async getParents(
    @Param('projectId') projectId: string,
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.hierarchyService.getParents(entityType, entityId);
  }
}
