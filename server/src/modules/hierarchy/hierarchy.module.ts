import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HierarchyService } from './hierarchy.service';
import { HierarchyController } from './hierarchy.controller';
import { RequirementEntity } from '../requirements/requirement.entity';
import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';
import { WorkItemEntity } from '../work-items/work-item.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      RequirementEntity,
      FeatureModuleEntity,
      WorkItemEntity,
    ]),
  ],
  providers: [HierarchyService],
  controllers: [HierarchyController],
  exports: [HierarchyService],
})
export class HierarchyModule {}
