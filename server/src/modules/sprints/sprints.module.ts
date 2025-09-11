import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { SprintEntity } from './sprint.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SprintEntity]), MembershipsModule],
  providers: [SprintsService, RolesGuard],
  controllers: [SprintsController],
})
export class SprintsModule {}


