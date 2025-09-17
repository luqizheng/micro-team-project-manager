import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { RequirementEntity } from './requirement.entity';
import { ProjectEntity } from '../projects/project.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequirementEntity,
      ProjectEntity,
    ]),
    MembershipsModule,
    UsersModule,
  ],
  providers: [RequirementsService],
  controllers: [RequirementsController],
  exports: [RequirementsService],
})
export class RequirementsModule {}
