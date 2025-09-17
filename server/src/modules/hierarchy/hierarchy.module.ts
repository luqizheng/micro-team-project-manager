import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HierarchyService } from './hierarchy.service';
import { HierarchyController } from './hierarchy.controller';
import { RequirementEntity } from '../requirements/requirement.entity';
import { SubsystemEntity } from '../subsystems/subsystem.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { TaskEntity } from '../tasks/task.entity';
import { BugEntity } from '../bugs/bug.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      RequirementEntity,
      SubsystemEntity,
      FeatureModuleEntity,
      TaskEntity,
      BugEntity,
    ]),
  ],
  providers: [HierarchyService],
  controllers: [HierarchyController],
  exports: [HierarchyService],
})
export class HierarchyModule {}
