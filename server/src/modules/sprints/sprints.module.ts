import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { SprintEntity } from './sprint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SprintEntity])],
  providers: [SprintsService],
  controllers: [SprintsController],
})
export class SprintsModule {}


