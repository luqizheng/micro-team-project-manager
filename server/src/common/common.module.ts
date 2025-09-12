import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from './guards/roles.guard';
import { MembershipsService } from '../modules/memberships/memberships.service';
import { UsersService } from '../modules/users/users.service';
import { MembershipEntity } from '../modules/memberships/membership.entity';
import { UserEntity } from '../modules/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipEntity, UserEntity])],
  providers: [RolesGuard, MembershipsService, UsersService],
  exports: [RolesGuard, MembershipsService, UsersService],
})
export class CommonModule {}
