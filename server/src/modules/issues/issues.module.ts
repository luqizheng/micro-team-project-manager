import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController, MyTasksController } from './issues.controller';
import { IssueEntity } from './issue.entity';
import { ProjectEntity } from '../projects/project.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';
import { IssueStatesModule } from '../issue-states/issue-states.module';
import { GitLabIntegrationModule } from '../gitlab-integration/gitlab-integration.module';
import { GitLabProjectMapping } from '../gitlab-integration/entities/gitlab-project-mapping.entity';
import { GitLabInstance } from '../gitlab-integration/entities/gitlab-instance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IssueEntity, 
      ProjectEntity,
      GitLabProjectMapping,
      GitLabInstance
    ]), 
    MembershipsModule, 
    CommonModule, 
    IssueStatesModule,
    forwardRef(() => GitLabIntegrationModule)
  ],
  providers: [IssuesService],
  controllers: [IssuesController, MyTasksController],
  exports: [IssuesService],
})
export class IssuesModule {}


