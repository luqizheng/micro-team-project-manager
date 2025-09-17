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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirementsService, CreateRequirementDto, UpdateRequirementDto, RequirementQueryParams } from './requirements.service';
import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  IsArray,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';

class CreateRequirementRequestDto {
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
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

class UpdateRequirementRequestDto {
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
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

@Controller('projects/:projectId/requirements')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Post()
  @Roles('admin', 'project_manager')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRequirementRequestDto,
  ) {
    return this.requirementsService.create(projectId, dto);
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
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const params: RequirementQueryParams = {
      projectId,
      page,
      pageSize,
      q,
      state,
      assigneeId,
      priority,
      sortField,
      sortOrder,
    };
    return this.requirementsService.paginate(params);
  }

  @Get('hierarchy')
  @Roles('admin', 'project_manager', 'member')
  async getHierarchy(@Param('projectId') projectId: string) {
    return this.requirementsService.getHierarchy(projectId);
  }

  @Get(':id')
  @Roles('admin', 'project_manager', 'member')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.requirementsService.findById(id);
  }

  @Patch(':id')
  @Roles('admin', 'project_manager')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRequirementRequestDto,
  ) {
    return this.requirementsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'project_manager')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    await this.requirementsService.delete(id);
    return { message: '需求删除成功' };
  }
}
