import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { IssueEntity } from './issue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity])],
  providers: [IssuesService],
  controllers: [IssuesController],
})
export class IssuesModule {}


