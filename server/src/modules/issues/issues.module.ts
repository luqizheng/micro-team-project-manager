import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { IssueEntity } from './issue.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity]), MembershipsModule],
  providers: [IssuesService, RolesGuard],
  controllers: [IssuesController],
  exports: [IssuesService],
})
export class IssuesModule {}


