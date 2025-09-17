import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { MyService } from './my.service';

@Controller('my-tasks')
@UseGuards(JwtAuthGuard)
export class MyController {
  constructor(private readonly my: MyService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtUser,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('q') q?: string,
    @Query('state') state?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const result = await this.my.listUserItems({
      userId: user.userId,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      q,
      state,
      priority,
      type,
      sortBy,
    });

    return { code: 0, data: result };
  }
}


