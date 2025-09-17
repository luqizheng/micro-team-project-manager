import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BoardsService } from './boards.service';

class CreateBoardDto {
  name!: string;
  description?: string;
  isDefault?: boolean;
}

class UpdateBoardDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

class CreateColumnDto {
  name!: string;
  description?: string;
  wipLimit?: number;
  sortOrder?: number;
  stateMapping!: string;
  color?: string;
}

class UpdateColumnDto {
  name?: string;
  description?: string;
  wipLimit?: number;
  sortOrder?: number;
  stateMapping?: string;
  color?: string;
}

class ReorderColumnsDto {
  columnIds!: string[];
}

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/boards')
export class BoardsController {
  constructor(private readonly service: BoardsService) {}

  @Get()
  async list(@Param('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.findWithColumns(id);
  }

  @Get(':id/kanban')
  async getKanban(
    @Param('projectId') projectId: string,
    @Param('id') boardId: string
  ) {
    return this.service.getBoardWithIssues(boardId, projectId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async create(
    @Param('projectId') projectId: string,
    @Body() data: CreateBoardDto
  ) {
    return this.service.create({
      projectId,
      ...data
    });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateBoardDto
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true };
  }

  @Post(':id/columns')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async createColumn(
    @Param('id') boardId: string,
    @Body() data: CreateColumnDto
  ) {
    return this.service.createColumn({
      boardId,
      ...data
    });
  }

  @Put('columns/:columnId')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async updateColumn(
    @Param('columnId') columnId: string,
    @Body() data: UpdateColumnDto
  ) {
    return this.service.updateColumn(columnId, data);
  }

  @Delete('columns/:columnId')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async deleteColumn(@Param('columnId') columnId: string) {
    await this.service.deleteColumn(columnId);
    return { success: true };
  }

  @Put(':id/columns/reorder')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async reorderColumns(
    @Param('id') boardId: string,
    @Body() data: ReorderColumnsDto
  ) {
    await this.service.reorderColumns(boardId, data.columnIds);
    return { success: true };
  }

  @Put('move-issue')
  @UseGuards(RolesGuard)
  @Roles('member', 'project_manager')
  async moveIssue(
    @Body() data: { issueId: string; columnId: string; issueType: 'task' | 'bug' }
  ) {
    await this.service.moveIssueToColumn(data.issueId, data.columnId, data.issueType);
    return { success: true };
  }
}
