import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/issues/:issueId/comments')
export class CommentsController {
  constructor(private readonly svc: CommentsService) {}

  @Get()
  list(@Param('issueId') issueId: string) {
    return this.svc.list(issueId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('member', 'project_admin')
  create(@Param('issueId') issueId: string, @Body() body: { body: string; authorId: string; mentions?: string[] }) {
    return this.svc.create({ issueId, authorId: body.authorId, body: body.body, mentions: body.mentions });
  }
}


