import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('hours')
  hours(
    @Param('projectId') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.hours(projectId, { from, to });
  }
}


