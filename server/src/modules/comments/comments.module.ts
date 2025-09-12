import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './comment.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity]), MembershipsModule, CommonModule],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}


