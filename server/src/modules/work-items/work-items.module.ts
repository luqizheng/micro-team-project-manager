import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkItemEntity } from './work-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkItemEntity])],
  exports: [TypeOrmModule],
})
export class WorkItemsModule {}


