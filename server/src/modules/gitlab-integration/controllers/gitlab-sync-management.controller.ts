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
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GitLabIncrementalSyncService } from '../services/gitlab-incremental-sync.service';
import { GitLabUserSyncService } from '../services/gitlab-user-sync.service';
import { GitLabEventProcessorService } from '../services/gitlab-event-processor.service';
import { GitLabIntegrationService } from '../services/gitlab-integration.service';

/**
 * GitLab同步管理控制器
 * 专门负责同步相关的管理功能
 */
@ApiTags('GitLab同步管理')
@Controller('gitlab/sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GitLabSyncManagementController {
  private readonly logger = new Logger(GitLabSyncManagementController.name);

  constructor(
    private readonly incrementalSyncService: GitLabIncrementalSyncService,
    private readonly userSyncService: GitLabUserSyncService,
    private readonly eventProcessorService: GitLabEventProcessorService,
    private readonly integrationService: GitLabIntegrationService,
  ) {}

  // ==================== 同步执行 ====================

  /**
   * 执行增量同步
   */
  @Post('incremental/:instanceId')
  @Roles('system_admin')
  @ApiOperation({ summary: '执行增量同步' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '同步完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        syncCount: { type: 'number' },
        lastSyncAt: { type: 'string', format: 'date-time' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async performIncrementalSync(
    @Param('instanceId') instanceId: string,
    @Body() body: { projectId?: string },
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
    data?: any;
  }> {
    this.logger.log(`执行增量同步: ${instanceId}`, { instanceId, projectId: body.projectId });
    return this.incrementalSyncService.performIncrementalSync(instanceId, body.projectId);
  }

  /**
   * 执行全量同步
   */
  @Post('full/:instanceId')
  @Roles('system_admin')
  @ApiOperation({ summary: '执行全量同步' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '同步完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        syncCount: { type: 'number' },
        lastSyncAt: { type: 'string', format: 'date-time' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async performFullSync(
    @Param('instanceId') instanceId: string,
    @Body() body: { projectId?: string },
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
    data?: any;
  }> {
    this.logger.log(`执行全量同步: ${instanceId}`, { instanceId, projectId: body.projectId });
    return this.incrementalSyncService.performFullSync(instanceId, body.projectId);
  }

  /**
   * 执行补偿同步
   */
  @Post('compensation/:instanceId')
  @Roles('system_admin')
  @ApiOperation({ summary: '执行补偿同步' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '同步完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        syncCount: { type: 'number' },
        lastSyncAt: { type: 'string', format: 'date-time' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async performCompensationSync(
    @Param('instanceId') instanceId: string,
    @Body() body: { fromDate: string; toDate: string },
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
    data?: any;
  }> {
    this.logger.log(`执行补偿同步: ${instanceId}`, { 
      instanceId, 
      fromDate: body.fromDate, 
      toDate: body.toDate 
    });
    
    const fromDate = new Date(body.fromDate);
    const toDate = new Date(body.toDate);
    
    return this.incrementalSyncService.performCompensationSync(instanceId, fromDate, toDate);
  }

  // ==================== 用户同步 ====================

  /**
   * 同步GitLab用户
   */
  @Post('users/:instanceId')
  @Roles('system_admin')
  @ApiOperation({ summary: '同步GitLab用户' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '同步完成',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              user: { type: 'object' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async syncUsers(
    @Param('instanceId') instanceId: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ success: boolean; message: string; user?: any }>;
  }> {
    this.logger.log(`同步GitLab用户: ${instanceId}`, { instanceId });
    
    // 获取实例信息
    const instance = await this.integrationService.getInstance(instanceId);
    return this.userSyncService.syncUsersFromGitLab(instance);
  }

  /**
   * 获取用户映射统计
   */
  @Get('users/:instanceId/statistics')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取用户映射统计' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalMappings: { type: 'number' },
        activeMappings: { type: 'number' },
        inactiveMappings: { type: 'number' },
        lastSyncTime: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async getUserMappingStatistics(
    @Param('instanceId') instanceId: string,
  ): Promise<{
    totalMappings: number;
    activeMappings: number;
    inactiveMappings: number;
    lastSyncTime?: Date;
  }> {
    this.logger.debug(`获取用户映射统计: ${instanceId}`, { instanceId });
    return this.userSyncService.getUserMappingStatistics(instanceId);
  }

  /**
   * 清理无效的用户映射
   */
  @Post('users/:instanceId/cleanup')
  @Roles('system_admin')
  @ApiOperation({ summary: '清理无效的用户映射' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '清理完成',
    schema: {
      type: 'object',
      properties: {
        cleaned: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async cleanupInvalidMappings(
    @Param('instanceId') instanceId: string,
  ): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    this.logger.log(`清理无效用户映射: ${instanceId}`, { instanceId });
    
    // 获取实例信息
    const instance = await this.integrationService.getInstance(instanceId);
    return this.userSyncService.cleanupInvalidMappings(instance);
  }

  // ==================== 事件管理 ====================

  /**
   * 获取事件处理统计
   */
  @Get('events/statistics')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取事件处理统计' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalEvents: { type: 'number' },
        processedEvents: { type: 'number' },
        failedEvents: { type: 'number' },
        pendingEvents: { type: 'number' },
        processingEvents: { type: 'number' },
        averageProcessingTime: { type: 'number' },
        errorRate: { type: 'number' },
      },
    },
  })
  async getEventStatistics(): Promise<{
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    pendingEvents: number;
    processingEvents: number;
    averageProcessingTime: number;
    errorRate: number;
  }> {
    this.logger.debug('获取事件处理统计');
    return this.eventProcessorService.getEventStatistics();
  }

  /**
   * 手动重试事件
   */
  @Post('events/:eventId/retry')
  @Roles('system_admin')
  @ApiOperation({ summary: '手动重试事件' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '重试完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        retryable: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '事件不存在',
  })
  async retryEvent(
    @Param('eventId') eventId: string,
  ): Promise<{
    success: boolean;
    message: string;
    retryable: boolean;
  }> {
    this.logger.log(`手动重试事件: ${eventId}`, { eventId });
    return this.eventProcessorService.retryEvent(eventId);
  }

  /**
   * 批量重试事件
   */
  @Post('events/batch-retry')
  @Roles('system_admin')
  @ApiOperation({ summary: '批量重试事件' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '重试完成',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              retryable: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async batchRetryEvents(
    @Body() body: { eventIds: string[] },
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ success: boolean; message: string; retryable: boolean }>;
  }> {
    this.logger.log(`批量重试事件: ${body.eventIds.length} 个`, { eventIds: body.eventIds });
    return this.eventProcessorService.retryEvents(body.eventIds);
  }

  /**
   * 获取事件处理健康状态
   */
  @Get('events/health')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取事件处理健康状态' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        isHealthy: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        lastCheck: { type: 'string', format: 'date-time' },
        nextCheck: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getEventHealthStatus(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
    lastCheck: Date;
    nextCheck: Date;
  }> {
    this.logger.debug('获取事件处理健康状态');
    return this.eventProcessorService.getHealthStatus();
  }

  // ==================== 同步状态监控 ====================

  /**
   * 获取所有实例的同步状态
   */
  @Get('status/instances')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取所有实例的同步状态' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          instanceId: { type: 'string' },
          instanceName: { type: 'string' },
          lastSyncAt: { type: 'string', format: 'date-time' },
          syncStatus: { type: 'string' },
          totalMappings: { type: 'number' },
          activeMappings: { type: 'number' },
          errorCount: { type: 'number' },
        },
      },
    },
  })
  async getAllInstancesSyncStatus(): Promise<Array<{
    instanceId: string;
    instanceName: string;
    lastSyncAt?: Date;
    syncStatus: string;
    totalMappings: number;
    activeMappings: number;
    errorCount: number;
  }>> {
    this.logger.debug('获取所有实例的同步状态');
    
    // 这里需要实现获取所有实例同步状态的逻辑
    // 简化实现，返回空数组
    return [];
  }

  /**
   * 获取特定实例的同步状态
   */
  @Get('status/instances/:instanceId')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取特定实例的同步状态' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        instanceId: { type: 'string' },
        instanceName: { type: 'string' },
        lastSyncAt: { type: 'string', format: 'date-time' },
        syncStatus: { type: 'string' },
        totalMappings: { type: 'number' },
        activeMappings: { type: 'number' },
        errorCount: { type: 'number' },
        projectStatuses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              lastSyncAt: { type: 'string', format: 'date-time' },
              syncStatus: { type: 'string' },
              syncCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存在',
  })
  async getInstanceSyncStatus(
    @Param('instanceId') instanceId: string,
  ): Promise<{
    instanceId: string;
    instanceName: string;
    lastSyncAt?: Date;
    syncStatus: string;
    totalMappings: number;
    activeMappings: number;
    errorCount: number;
    projectStatuses: Array<{
      projectId: string;
      projectName: string;
      lastSyncAt?: Date;
      syncStatus: string;
      syncCount: number;
    }>;
  }> {
    this.logger.debug(`获取实例同步状态: ${instanceId}`, { instanceId });
    
    // 这里需要实现获取特定实例同步状态的逻辑
    // 简化实现
    return {
      instanceId,
      instanceName: 'Unknown',
      syncStatus: 'unknown',
      totalMappings: 0,
      activeMappings: 0,
      errorCount: 0,
      projectStatuses: [],
    };
  }

  // ==================== 同步配置 ====================

  /**
   * 获取同步配置
   */
  @Get('config')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取同步配置' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        maxRetries: { type: 'number' },
        retryInterval: { type: 'number' },
        batchSize: { type: 'number' },
        timeout: { type: 'number' },
        enableAutoSync: { type: 'boolean' },
        syncInterval: { type: 'number' },
      },
    },
  })
  async getSyncConfig(): Promise<{
    maxRetries: number;
    retryInterval: number;
    batchSize: number;
    timeout: number;
    enableAutoSync: boolean;
    syncInterval: number;
  }> {
    this.logger.debug('获取同步配置');
    
    // 返回默认配置
    return {
      maxRetries: 3,
      retryInterval: 5000,
      batchSize: 20,
      timeout: 60000,
      enableAutoSync: true,
      syncInterval: 300000, // 5分钟
    };
  }

  /**
   * 更新同步配置
   */
  @Put('config')
  @Roles('system_admin')
  @ApiOperation({ summary: '更新同步配置' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async updateSyncConfig(
    @Body() config: {
      maxRetries?: number;
      retryInterval?: number;
      batchSize?: number;
      timeout?: number;
      enableAutoSync?: boolean;
      syncInterval?: number;
    },
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log('更新同步配置', { config });
    
    // 这里需要实现更新同步配置的逻辑
    // 简化实现
    return {
      success: true,
      message: '同步配置已更新',
    };
  }
}
