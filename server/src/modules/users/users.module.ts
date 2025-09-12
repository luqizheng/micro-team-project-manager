import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MembershipEntity } from '../memberships/membership.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, MembershipEntity]), CommonModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}


