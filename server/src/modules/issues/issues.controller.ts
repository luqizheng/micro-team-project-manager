import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IssuesService } from './issues.service';
import { IssueType } from './issue.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(private readonly service: IssuesService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('type') type?: IssueType,
    @Query('state') state?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('sprintId') sprintId?: string,
  ) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    return this.service.paginate({ page: p, pageSize: s, q, type, state, assigneeId, sprintId });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('member', 'project_admin')
  create(@Body() body: any) {
    if (body.type === 'task') {
      if (body.estimatedHours != null && !/^\d{1,3}(\.\d)?$/.test(String(body.estimatedHours))) {
        throw new Error('estimatedHours must be a number with 1 decimal at most');
      }
      if (body.actualHours != null && !/^\d{1,3}(\.\d)?$/.test(String(body.actualHours))) {
        throw new Error('actualHours must be a number with 1 decimal at most');
      }
    } else {
      body.estimatedHours = null;
      body.actualHours = null;
    }
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_admin')
  update(@Param('id') id: string, @Body() body: any) {
    if (body.type === 'task' || body.estimatedHours != null || body.actualHours != null) {
      if (body.estimatedHours != null && !/^\d{1,3}(\.\d)?$/.test(String(body.estimatedHours))) {
        throw new Error('estimatedHours must be a number with 1 decimal at most');
      }
      if (body.actualHours != null && !/^\d{1,3}(\.\d)?$/.test(String(body.actualHours))) {
        throw new Error('actualHours must be a number with 1 decimal at most');
      }
    }
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/transition')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_admin')
  transition(@Param('id') id: string, @Body() body: { to: string }) {
    return this.service.update(id, { state: body.to });
  }
}


