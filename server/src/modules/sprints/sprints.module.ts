import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { SprintEntity } from './sprint.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([SprintEntity]), MembershipsModule, CommonModule],
  providers: [SprintsService],
  controllers: [SprintsController],
})
export class SprintsModule {}


