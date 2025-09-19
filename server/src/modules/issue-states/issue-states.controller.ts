import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IssueStatesService } from './issue-states.service';
import { IssueType } from './issue-state.entity';
import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, Length } from 'class-validator';

class CreateIssueStateDto {
  @IsEnum(IssueType)
  issueType!: IssueType;

  @IsString()
  @Length(1, 32)
  stateKey!: string;

  @IsString()
  @Length(1, 64)
  stateName!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isInitial?: boolean;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

class UpdateIssueStateDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  stateName?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isInitial?: boolean;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

class ReorderStatesDto {
  @IsEnum(IssueType)
  issueType!: IssueType;

  @IsString({ each: true })
  stateOrder!: string[];
}

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/issue-states')
export class IssueStatesController {
  constructor(private readonly service: IssueStatesService) {}

  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Query('type') type?: IssueType,
  ) {
    if (type) {
      return this.service.findByProjectAndType(projectId, type);
    }
    
    // 返回所有类型的状�?
    const [requirement, task, bug] = await Promise.all([
      this.service.findByProjectAndType(projectId, IssueType.requirement),
      this.service.findByProjectAndType(projectId, IssueType.task),
      this.service.findByProjectAndType(projectId, IssueType.bug),
    ]);

    return {
      requirement,
      task,
      bug,
    };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() data: CreateIssueStateDto,
  ) {
    return this.service.create({
      projectId,
      ...data,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateIssueStateDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true };
  }

  @Put('reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @Body() data: ReorderStatesDto,
  ) {
    await this.service.reorder(projectId, data.issueType, data.stateOrder);
    return { success: true };
  }
}
