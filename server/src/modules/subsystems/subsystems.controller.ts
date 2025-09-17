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
import { SubsystemsService, CreateSubsystemDto, UpdateSubsystemDto, SubsystemQueryParams } from './subsystems.service';
import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  IsArray,
} from 'class-validator';

class CreateSubsystemRequestDto {
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
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsUUID()
  requirementId?: string;
}

class UpdateSubsystemRequestDto {
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
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsUUID()
  requirementId?: string;
}

@Controller('projects/:projectId/subsystems')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SubsystemsController {
  constructor(private readonly subsystemsService: SubsystemsService) {}

  @Post()
  @Roles('admin', 'project_manager')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSubsystemRequestDto,
  ) {
    return this.subsystemsService.create(projectId, dto);
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
    @Query('requirementId') requirementId?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const params: SubsystemQueryParams = {
      projectId,
      page,
      pageSize,
      q,
      state,
      assigneeId,
      requirementId,
      sortField,
      sortOrder,
    };
    return this.subsystemsService.paginate(params);
  }

  @Get('by-requirement/:requirementId')
  @Roles('admin', 'project_manager', 'member')
  async getByRequirement(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.subsystemsService.getByRequirement(requirementId);
  }

  @Get(':id')
  @Roles('admin', 'project_manager', 'member')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.subsystemsService.findById(id);
  }

  @Patch(':id')
  @Roles('admin', 'project_manager')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubsystemRequestDto,
  ) {
    return this.subsystemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'project_manager')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    await this.subsystemsService.delete(id);
    return { message: '子系统删除成功' };
  }
}
