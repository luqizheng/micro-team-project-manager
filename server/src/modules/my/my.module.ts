import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyController } from './my.controller';
import { MyService } from './my.service';
import { WorkItemEntity } from '../work-items/work-item.entity';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementsModule } from '../requirements/requirements.module';
import { SubsystemsModule } from '../subsystems/subsystems.module';
import { FeatureModulesModule } from '../feature-modules/feature-modules.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkItemEntity, ProjectEntity]),
    MembershipsModule,
  ],
  controllers: [MyController],
  providers: [MyService],
})
export class MyModule {}


