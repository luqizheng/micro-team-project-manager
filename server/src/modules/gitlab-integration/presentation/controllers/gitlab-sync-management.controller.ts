/**
 * GitLab同步管理控制器
 * 负责GitLab同步管理API
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { GitLabSyncService } from '../../application/services/gitlab-sync.service';
import { GitLabExceptionFilter } from '../../shared/middleware/gitlab-exception.filter';
import {
  SyncStatusResponseDto,
  SyncConfigDto,
  SyncResultDto,
} from '../dto';

/**
 * GitLab同步管理控制器
 * 负责GitLab数据同步的管理和监控
 */
@ApiTags('GitLab同步管理')
@Controller('gitlab/sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseFilters(GitLabExceptionFilter)
export class GitLabSyncManagementController {
  private readonly logger = new Logger(GitLabSyncManagementController.name);

  constructor(
    private readonly syncService: GitLabSyncService,
  ) {}

  /**
   * 启动同步
   */
  @Post('start')
  @Roles('admin')
  @ApiOperation({ summary: '启动同步' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '同步启动成功',
    type: SyncResultDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '同步配置无效' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '同步已在进行中' 
  })
  async startSync(@Body() config: SyncConfigDto): Promise<SyncResultDto> {
    this.logger.log(`启动同步: ${config.instanceId}`);
    return await this.syncService.startSync(config);
  }

  /**
   * 停止同步
   */
  @Post('stop')
  @Roles('admin')
  @ApiOperation({ summary: '停止同步' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '同步停止成功' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '没有正在进行的同步' 
  })
  async stopSync(): Promise<void> {
    this.logger.log('停止同步');
    await this.syncService.stopSync();
  }

  /**
   * 获取同步状态
   */
  @Get('status')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '获取同步状态' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: SyncStatusResponseDto,
  })
  async getSyncStatus(): Promise<SyncStatusResponseDto> {
    this.logger.log('获取同步状态');
    return await this.syncService.getSyncStatus();
  }

  /**
   * 获取同步历史
   */
  @Get('history')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '获取同步历史' })
  @ApiQuery({ name: 'instanceId', required: false, description: '实例ID' })
  @ApiQuery({ name: 'limit', required: false, description: '限制数量' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: [SyncStatusResponseDto],
  })
  async getSyncHistory(
    @Query('instanceId') instanceId?: string,
    @Query('limit') limit?: number,
  ): Promise<SyncStatusResponseDto[]> {
    this.logger.log(`获取同步历史: instanceId=${instanceId}, limit=${limit}`);
    return await this.syncService.getSyncHistory(instanceId, limit);
  }

  /**
   * 强制同步
   */
  @Post('force')
  @Roles('admin')
  @ApiOperation({ summary: '强制同步' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '强制同步启动成功',
    type: SyncResultDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '同步配置无效' 
  })
  async forceSync(@Body() config: SyncConfigDto): Promise<SyncResultDto> {
    this.logger.log(`强制同步: ${config.instanceId}`);
    return await this.syncService.forceSync(config);
  }

  /**
   * 清理同步数据
   */
  @Delete('cleanup')
  @Roles('admin')
  @ApiOperation({ summary: '清理同步数据' })
  @ApiQuery({ name: 'olderThan', required: false, description: '清理多少天前的数据' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '清理成功' 
  })
  async cleanupSyncData(@Query('olderThan') olderThan?: number): Promise<void> {
    this.logger.log(`清理同步数据: olderThan=${olderThan}`);
    await this.syncService.cleanupSyncData(olderThan);
  }

  /**
   * 获取同步统计
   */
  @Get('stats')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '获取同步统计' })
  @ApiQuery({ name: 'instanceId', required: false, description: '实例ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalSyncs: { type: 'number' },
        successfulSyncs: { type: 'number' },
        failedSyncs: { type: 'number' },
        lastSyncTime: { type: 'string' },
        averageSyncDuration: { type: 'number' },
      },
    },
  })
  async getSyncStats(@Query('instanceId') instanceId?: string): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncTime: string | null;
    averageSyncDuration: number;
  }> {
    this.logger.log(`获取同步统计: instanceId=${instanceId}`);
    return await this.syncService.getSyncStats(instanceId);
  }
}
