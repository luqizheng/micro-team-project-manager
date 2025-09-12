import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController, MyTasksController } from './issues.controller';
import { IssueEntity } from './issue.entity';
import { ProjectEntity } from '../projects/project.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';
import { IssueStatesModule } from '../issue-states/issue-states.module';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity, ProjectEntity]), MembershipsModule, CommonModule, IssueStatesModule],
  providers: [IssuesService],
  controllers: [IssuesController, MyTasksController],
  exports: [IssuesService],
})
export class IssuesModule {}


