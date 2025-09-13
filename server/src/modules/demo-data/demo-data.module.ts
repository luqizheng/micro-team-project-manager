import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoDataService } from './demo-data.service';
import { UserEntity } from '../users/user.entity';
import { ProjectEntity } from '../projects/project.entity';
import { IssueEntity } from '../issues/issue.entity';
import { MembershipEntity } from '../memberships/membership.entity';
import { IssueStateEntity } from '../issue-states/issue-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ProjectEntity,
      IssueEntity,
      MembershipEntity,
      IssueStateEntity,
    ]),
  ],
  providers: [DemoDataService],
  exports: [DemoDataService],
})
export class DemoDataModule {}
