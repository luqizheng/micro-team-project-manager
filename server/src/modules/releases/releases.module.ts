import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseEntity } from './release.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { IssuesModule } from '../issues/issues.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseEntity]), IssuesModule, MembershipsModule],
  providers: [ReleasesService, RolesGuard],
  controllers: [ReleasesController],
})
export class ReleasesModule {}


