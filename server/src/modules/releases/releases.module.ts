import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseEntity } from './release.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';

import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';
import { WorkItemsModule } from '../work-items/work-items.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseEntity]), WorkItemsModule, MembershipsModule, CommonModule],
  providers: [ReleasesService],
  controllers: [ReleasesController],
})
export class ReleasesModule {}


