import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { IssueEntity } from '../issues/issue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}


