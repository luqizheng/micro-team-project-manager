import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IsArray, IsOptional, IsString, IsUUID, Length } from 'class-validator';

class CreateCommentDto {
  @IsUUID()
  issueId!: string;

  @IsUUID()
  authorId!: string;

  @IsString()
  @Length(1, 2000)
  body!: string;

  @IsOptional()
  @IsArray()
  mentions?: string[];
}

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
  @Roles('member', 'project_manager')
  create(@Param('issueId') issueId: string, @Body() body: CreateCommentDto) {
    return this.svc.create({ issueId, authorId: body.authorId, body: body.body, mentions: body.mentions });
  }
}


