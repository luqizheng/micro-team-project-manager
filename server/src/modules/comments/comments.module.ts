import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './comment.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity]), MembershipsModule],
  providers: [CommentsService, RolesGuard],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}


