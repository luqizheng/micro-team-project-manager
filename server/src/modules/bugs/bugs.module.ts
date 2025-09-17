import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BugsService } from './bugs.service';
import { BugsController } from './bugs.controller';
import { BugEntity } from './bug.entity';
import { ProjectEntity } from '../projects/project.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BugEntity,
      ProjectEntity,
      SubsystemEntity,
      FeatureModuleEntity,
    ]),
    MembershipsModule,
    UsersModule,
  ],
  providers: [BugsService],
  controllers: [BugsController],
  exports: [BugsService],
})
export class BugsModule {}
