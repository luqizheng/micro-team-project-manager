import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseEntity } from './release.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseEntity]), IssuesModule],
  providers: [ReleasesService],
  controllers: [ReleasesController],
})
export class ReleasesModule {}


