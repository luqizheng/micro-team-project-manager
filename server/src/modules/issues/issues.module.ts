import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { IssueEntity } from './issue.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity]), MembershipsModule, CommonModule],
  providers: [IssuesService],
  controllers: [IssuesController],
  exports: [IssuesService],
})
export class IssuesModule {}


