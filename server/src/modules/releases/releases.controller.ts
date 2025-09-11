import { Body, Controller, Get, Param, Patch, Post, UseGuards, Query } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IsOptional, IsString, Length } from 'class-validator';

class CreateReleaseDto {
  @IsString()
  @Length(1, 80)
  name!: string;

  @IsString()
  @Length(1, 40)
  tag!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/releases')
export class ReleasesController {
  constructor(private readonly svc: ReleasesService) {}

  @Get()
  list(
    @Param('projectId') projectId: string,
    @Query('q') q?: string,
    @Query('released') released?: 'released' | 'draft',
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.svc.list(projectId, { q, released, sortField, sortOrder });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('project_admin')
  create(@Param('projectId') projectId: string, @Body() body: CreateReleaseDto) {
    return this.svc.create(projectId, body);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('project_admin')
  publish(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.svc.publish(projectId, id);
  }
}


