import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueStateEntity } from './issue-state.entity';
import { IssueStatesService } from './issue-states.service';
import { IssueStatesController } from './issue-states.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IssueStateEntity])],
  providers: [IssueStatesService],
  controllers: [IssueStatesController],
  exports: [IssueStatesService],
})
export class IssueStatesModule {}
