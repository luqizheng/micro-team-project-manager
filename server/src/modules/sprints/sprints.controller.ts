import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SprintsService } from './sprints.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/sprints')
export class SprintsController {
  constructor(private readonly service: SprintsService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('projectId') projectId?: string,
    @Query('q') q?: string,
  ) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    return this.service.paginate({ page: p, pageSize: s, projectId, q });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


