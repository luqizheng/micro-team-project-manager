import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/releases')
export class ReleasesController {
  constructor(private readonly svc: ReleasesService) {}

  @Get()
  list(@Param('projectId') projectId: string) {
    return this.svc.list(projectId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('project_admin')
  create(@Param('projectId') projectId: string, @Body() body: { name: string; tag: string; notes?: string }) {
    return this.svc.create(projectId, body);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('project_admin')
  publish(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.svc.publish(projectId, id);
  }
}


