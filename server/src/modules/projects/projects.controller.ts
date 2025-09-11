import { Body, Controller, Delete, Get, Param, Patch, Post, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProjectsService } from './projects.service';

class CreateProjectDto {
  key!: string;
  name!: string;
  visibility?: 'private' | 'public';
}

class UpdateProjectDto {
  name?: string;
  visibility?: 'private' | 'public';
  archived?: boolean;
}

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('visibility') visibility?: 'private' | 'public',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    return this.service.paginate({ page: pageNum, pageSize: sizeNum, q, visibility });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('member', 'project_admin')
  create(@Body() body: CreateProjectDto) {
    if (!/^[A-Z0-9-]{2,20}$/.test(body.key)) {
      throw new BadRequestException('key must match ^[A-Z0-9-]{2,20}$');
    }
    return this.service.create({ ...body, createdBy: 'system' });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


