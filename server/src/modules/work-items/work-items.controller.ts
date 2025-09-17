import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkItemsService, CreateWorkItemDto, UpdateWorkItemDto } from './work-items.service';

@Controller('work-items')
@UseGuards(JwtAuthGuard)
export class WorkItemsController {
  constructor(private readonly service: WorkItemsService) {}

  @Get()
  async list(
    @Query('projectId') projectId?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('q') q?: string,
    @Query('state') state?: string,
    @Query('type') type?: 'task' | 'bug',
    @Query('assigneeId') assigneeId?: string,
    @Query('priority') priority?: string,
  ) {
    const result = await this.service.paginate({ projectId, page: Number(page), pageSize: Number(pageSize), q, state, type, assigneeId, priority });
    return { code: 0, data: result };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const item = await this.service.findById(id);
    return { code: 0, data: item };
  }

  @Post()
  async create(@Body() dto: CreateWorkItemDto) {
    const item = await this.service.create(dto);
    return { code: 0, data: item };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkItemDto) {
    const item = await this.service.update(id, dto);
    return { code: 0, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.softDelete(id);
    return { code: 0, data: true };
  }
}


