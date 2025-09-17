import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubsystemsService } from './subsystems.service';
import { SubsystemsController } from './subsystems.controller';
import { SubsystemEntity } from './subsystem.entity';
import { ProjectEntity } from '../projects/project.entity';
import { RequirementEntity } from '../requirements/requirement.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubsystemEntity,
      ProjectEntity,
      RequirementEntity,
    ]),
    MembershipsModule,
    UsersModule,
  ],
  providers: [SubsystemsService],
  controllers: [SubsystemsController],
  exports: [SubsystemsService],
})
export class SubsystemsModule {}
