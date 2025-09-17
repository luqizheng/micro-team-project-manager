import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BugsService, CreateBugDto, UpdateBugDto, BugQueryParams } from './bugs.service';
import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  IsArray,
  IsDateString,
} from 'class-validator';

class CreateBugRequestDto {
  @IsString()
  @Length(1, 140)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsUUID()
  subsystemId?: string;

  @IsOptional()
  @IsUUID()
  featureModuleId?: string;
}

class UpdateBugRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 140)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsUUID()
  subsystemId?: string;

  @IsOptional()
  @IsUUID()
  featureModuleId?: string;
}

@Controller('projects/:projectId/bugs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  @Post()
  @Roles('admin', 'project_manager')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBugRequestDto,
  ) {
    return this.bugsService.create(projectId, dto);
  }

  @Get()
  @Roles('admin', 'project_manager', 'member')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('q') q?: string,
    @Query('state') state?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
    @Query('severity') severity?: string,
    @Query('subsystemId') subsystemId?: string,
    @Query('featureModuleId') featureModuleId?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const params: BugQueryParams = {
      projectId,
      page,
      pageSize,
      q,
      state,
      assigneeId,
      priority,
      severity,
      subsystemId,
      featureModuleId,
      sortField,
      sortOrder,
    };
    return this.bugsService.paginate(params);
  }

  @Get('by-subsystem/:subsystemId')
  @Roles('admin', 'project_manager', 'member')
  async getBySubsystem(
    @Param('projectId') projectId: string,
    @Param('subsystemId') subsystemId: string,
  ) {
    return this.bugsService.getBySubsystem(subsystemId);
  }

  @Get('by-feature-module/:featureModuleId')
  @Roles('admin', 'project_manager', 'member')
  async getByFeatureModule(
    @Param('projectId') projectId: string,
    @Param('featureModuleId') featureModuleId: string,
  ) {
    return this.bugsService.getByFeatureModule(featureModuleId);
  }

  @Get(':id')
  @Roles('admin', 'project_manager', 'member')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.bugsService.findById(id);
  }

  @Patch(':id')
  @Roles('admin', 'project_manager')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBugRequestDto,
  ) {
    return this.bugsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'project_manager')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    await this.bugsService.delete(id);
    return { message: '缺陷删除成功' };
  }
}
