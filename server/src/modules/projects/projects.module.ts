import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectEntity } from './project.entity';
import { MembershipEntity } from '../memberships/membership.entity';
import { UserEntity } from '../users/user.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, MembershipEntity, UserEntity]), 
    MembershipsModule, 
    CommonModule
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}


