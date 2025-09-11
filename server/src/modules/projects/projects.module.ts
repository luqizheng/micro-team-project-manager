import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectEntity } from './project.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity]), MembershipsModule],
  providers: [ProjectsService, RolesGuard],
  controllers: [ProjectsController],
})
export class ProjectsModule {}


