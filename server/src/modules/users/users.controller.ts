import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'project_manager')
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    if(!status) {
      status = "active";
    }
    return this.usersService.findAll({ page, pageSize, q, status });
  }

  @Get(':id')
  @Roles('admin', 'project_manager')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.usersService.updateStatus(id, body.status);
  }

  @Get(':id/memberships')
  @Roles('admin', 'project_manager')
  async getUserMemberships(@Param('id') id: string) {
    return this.usersService.getUserMemberships(id);
  }

  @Patch(':id/password')
  @Roles('admin')
  async updatePassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.usersService.updatePassword(id, body.password);
  }
}
