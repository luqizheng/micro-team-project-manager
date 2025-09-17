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
import { TasksService, CreateTaskDto, UpdateTaskDto, TaskQueryParams } from './tasks.service';
import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';

class CreateTaskRequestDto {
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
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsNumber()
  storyPoints?: number;

  @IsOptional()
  @IsNumber()
  estimateMinutes?: number;

  @IsOptional()
  @IsNumber()
  remainingMinutes?: number;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @IsOptional()
  @IsUUID()
  subsystemId?: string;

  @IsOptional()
  @IsUUID()
  featureModuleId?: string;
}

class UpdateTaskRequestDto {
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
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsNumber()
  storyPoints?: number;

  @IsOptional()
  @IsNumber()
  estimateMinutes?: number;

  @IsOptional()
  @IsNumber()
  remainingMinutes?: number;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @IsOptional()
  @IsUUID()
  subsystemId?: string;

  @IsOptional()
  @IsUUID()
  featureModuleId?: string;
}

@Controller('projects/:projectId/tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('admin', 'project_manager')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskRequestDto,
  ) {
    return this.tasksService.create(projectId, dto);
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
    @Query('requirementId') requirementId?: string,
    @Query('subsystemId') subsystemId?: string,
    @Query('featureModuleId') featureModuleId?: string,
    @Query('parentId') parentId?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const params: TaskQueryParams = {
      projectId,
      page,
      pageSize,
      q,
      state,
      assigneeId,
      priority,
      requirementId,
      subsystemId,
      featureModuleId,
      parentId,
      sortField,
      sortOrder,
    };
    return this.tasksService.paginate(params);
  }

  @Get('by-requirement/:requirementId')
  @Roles('admin', 'project_manager', 'member')
  async getByRequirement(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.tasksService.getByRequirement(requirementId);
  }

  @Get('by-subsystem/:subsystemId')
  @Roles('admin', 'project_manager', 'member')
  async getBySubsystem(
    @Param('projectId') projectId: string,
    @Param('subsystemId') subsystemId: string,
  ) {
    return this.tasksService.getBySubsystem(subsystemId);
  }

  @Get('by-feature-module/:featureModuleId')
  @Roles('admin', 'project_manager', 'member')
  async getByFeatureModule(
    @Param('projectId') projectId: string,
    @Param('featureModuleId') featureModuleId: string,
  ) {
    return this.tasksService.getByFeatureModule(featureModuleId);
  }

  @Get('children/:parentId')
  @Roles('admin', 'project_manager', 'member')
  async getChildren(
    @Param('projectId') projectId: string,
    @Param('parentId') parentId: string,
  ) {
    return this.tasksService.getChildren(parentId);
  }

  @Get(':id')
  @Roles('admin', 'project_manager', 'member')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.findById(id);
  }

  @Patch(':id')
  @Roles('admin', 'project_manager')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskRequestDto,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'project_manager')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    await this.tasksService.delete(id);
    return { message: '任务删除成功' };
  }
}
