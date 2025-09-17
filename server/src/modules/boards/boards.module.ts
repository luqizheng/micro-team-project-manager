import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from './board.entity';
import { BoardColumnEntity } from './board-column.entity';
import { TaskEntity } from '../tasks/task.entity';
import { BugEntity } from '../bugs/bug.entity';
import { MembershipsModule } from '../memberships/memberships.module';
import { UsersModule } from '../users/users.module';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BoardEntity, BoardColumnEntity, TaskEntity, BugEntity]),
    MembershipsModule,
    UsersModule
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService]
})
export class BoardsModule {}
