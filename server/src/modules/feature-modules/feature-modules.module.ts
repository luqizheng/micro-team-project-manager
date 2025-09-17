import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureModulesService } from './feature-modules.service';
import { FeatureModulesController } from './feature-modules.controller';
import { FeatureModuleEntity } from './feature-module.entity';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementEntity } from '../requirements/requirement.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureModuleEntity,
      ProjectEntity,
      RequirementEntity,
      SubsystemEntity,
    ]),
    MembershipsModule,
    UsersModule,
  ],
  providers: [FeatureModulesService],
  controllers: [FeatureModulesController],
  exports: [FeatureModulesService],
})
export class FeatureModulesModule {}
