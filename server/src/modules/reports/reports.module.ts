import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { WorkItemEntity } from '../work-items/work-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkItemEntity])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}


