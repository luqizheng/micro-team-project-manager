import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(CommentEntity) private readonly repo: Repository<CommentEntity>) {}

  list(issueId: string) {
    return this.repo.find({ where: { issueId }, order: { createdAt: 'ASC' } });
  }

  create(data: Partial<CommentEntity>) {
    return this.repo.save(this.repo.create(data));
  }
}


