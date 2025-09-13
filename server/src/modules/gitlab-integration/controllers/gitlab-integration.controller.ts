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
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
// import { RolesGuard } from "../../common/guards/roles.guard";
// import { Roles } from "../../common/decorators/roles.decorator";
import { GitLabIntegrationService } from '../services/gitlab-integration.service';
import { GitLabIncrementalSyncService } from '../services/gitlab-incremental-sync.service';
import { GitLabUserSyncService } from '../services/gitlab-user-sync.service';
import { GitLabEventProcessorService } from '../services/gitlab-event-processor.service';
import { 
  CreateGitLabInstanceDto, 
  UpdateGitLabInstanceDto,
  CreateProjectMappingDto,
  UpdateProjectMappingDto,
  GitLabInstanceResponseDto,
  ProjectMappingResponseDto,
} from '../dto';

/**
 * GitLab集成管理控制�?
 * 负责GitLab实例和项目映射的管理
 */
@ApiTags('GitLab集成管理')
@Controller('gitlab')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GitLabIntegrationController {
  private readonly logger = new Logger(GitLabIntegrationController.name);

  constructor(
    private readonly integrationService: GitLabIntegrationService,
    private readonly incrementalSyncService: GitLabIncrementalSyncService,
    private readonly userSyncService: GitLabUserSyncService,
    private readonly eventProcessorService: GitLabEventProcessorService,
  ) {}

  // ==================== GitLab实例管理 ====================

  /**
   * 获取所有GitLab实例
   */
  @Get('instances')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取所有GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: [GitLabInstanceResponseDto],
  })
  async getInstances(): Promise<GitLabInstanceResponseDto[]> {
    this.logger.debug('获取所有GitLab实例');
    return this.integrationService.getAllInstances();
  }

  /**
   * 获取特定GitLab实例
   */
  @Get('instances/:id')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取特定GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: GitLabInstanceResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  async getInstance(@Param('id') id: string): Promise<GitLabInstanceResponseDto> {
    this.logger.debug(`获取GitLab实例: ${id}`);
    return this.integrationService.getInstance(id);
  }

  /**
   * 创建GitLab实例
   */
  @Post('instances')
  @Roles('system_admin')
  @ApiOperation({ summary: '创建GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '创建成功',
    type: GitLabInstanceResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '实例名称已存�?,
  })
  async createInstance(@Body() dto: CreateGitLabInstanceDto): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`创建GitLab实例: ${dto.name}`);
    return this.integrationService.createInstance(dto);
  }

  /**
   * 更新GitLab实例
   */
  @Put('instances/:id')
  @Roles('system_admin')
  @ApiOperation({ summary: '更新GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功',
    type: GitLabInstanceResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '实例名称已存�?,
  })
  async updateInstance(
    @Param('id') id: string,
    @Body() dto: UpdateGitLabInstanceDto,
  ): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`更新GitLab实例: ${id}`);
    return this.integrationService.updateInstance(id, dto);
  }

  /**
   * 删除GitLab实例
   */
  @Delete('instances/:id')
  @Roles('system_admin')
  @ApiOperation({ summary: '删除GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: '删除成功',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '实例存在关联的项目映�?,
  })
  async deleteInstance(@Param('id') id: string): Promise<void> {
    this.logger.log(`删除GitLab实例: ${id}`);
    await this.integrationService.deleteInstance(id);
  }

  /**
   * 测试GitLab实例连接
   */
  @Post('instances/:id/test')
  @Roles('system_admin')
  @ApiOperation({ summary: '测试GitLab实例连接' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '测试完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  async testInstanceConnection(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    this.logger.log(`测试GitLab实例连接: ${id}`);
    return this.integrationService.testInstanceConnection(id);
  }

  // ==================== 项目映射管理 ====================

  /**
   * 获取项目的所有映�?
   */
  @Get('projects/:projectId/mappings')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '获取项目的所有映�? })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: [ProjectMappingResponseDto],
  })
  async getProjectMappings(@Param('projectId') projectId: string): Promise<ProjectMappingResponseDto[]> {
    this.logger.debug(`获取项目映射: ${projectId}`);
    return this.integrationService.getProjectMappings(projectId);
  }

  /**
   * 获取特定项目映射
   */
  @Get('projects/:projectId/mappings/:mappingId')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '获取特定项目映射' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: ProjectMappingResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射不存�?,
  })
  async getProjectMapping(
    @Param('projectId') projectId: string,
    @Param('mappingId') mappingId: string,
  ): Promise<ProjectMappingResponseDto> {
    this.logger.debug(`获取项目映射: ${projectId}/${mappingId}`);
    return this.integrationService.getProjectMapping(projectId, mappingId);
  }

  /**
   * 创建项目映射
   */
  @Post('projects/:projectId/mappings')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '创建项目映射' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '创建成功',
    type: ProjectMappingResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '项目或GitLab实例不存�?,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '项目映射已存�?,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '无法访问GitLab项目',
  })
  async createProjectMapping(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectMappingDto,
  ): Promise<ProjectMappingResponseDto> {
    this.logger.log(`创建项目映射: ${projectId} -> ${dto.gitlabProjectPath}`);
    return this.integrationService.createProjectMapping(projectId, dto);
  }

  /**
   * 更新项目映射
   */
  @Put('projects/:projectId/mappings/:mappingId')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '更新项目映射' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功',
    type: ProjectMappingResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射不存�?,
  })
  async updateProjectMapping(
    @Param('projectId') projectId: string,
    @Param('mappingId') mappingId: string,
    @Body() dto: UpdateProjectMappingDto,
  ): Promise<ProjectMappingResponseDto> {
    this.logger.log(`更新项目映射: ${projectId}/${mappingId}`);
    return this.integrationService.updateProjectMapping(projectId, mappingId, dto);
  }

  /**
   * 删除项目映射
   */
  @Delete('projects/:projectId/mappings/:mappingId')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '删除项目映射' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: '删除成功',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射不存�?,
  })
  async deleteProjectMapping(
    @Param('projectId') projectId: string,
    @Param('mappingId') mappingId: string,
  ): Promise<void> {
    this.logger.log(`删除项目映射: ${projectId}/${mappingId}`);
    await this.integrationService.deleteProjectMapping(projectId, mappingId);
  }

  /**
   * 手动同步项目映射
   */
  @Post('projects/:projectId/mappings/:mappingId/sync')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '手动同步项目映射' })
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
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射不存�?,
  })
  async syncProjectMapping(
    @Param('projectId') projectId: string,
    @Param('mappingId') mappingId: string,
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
  }> {
    this.logger.log(`手动同步项目映射: ${projectId}/${mappingId}`);
    return this.integrationService.syncProjectMapping(projectId, mappingId);
  }

  // ==================== 统计和监�?====================

  /**
   * 获取同步统计信息
   */
  @Get('statistics')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取同步统计信息' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalMappings: { type: 'number' },
        activeMappings: { type: 'number' },
        successfulSyncs: { type: 'number' },
        failedSyncs: { type: 'number' },
        inProgressSyncs: { type: 'number' },
        lastSyncTime: { type: 'string', format: 'date-time' },
        averageSyncTime: { type: 'number' },
        errorRate: { type: 'number' },
      },
    },
  })
  async getSyncStatistics(): Promise<{
    totalMappings: number;
    activeMappings: number;
    successfulSyncs: number;
    failedSyncs: number;
    inProgressSyncs: number;
    lastSyncTime?: Date;
    averageSyncTime: number;
    errorRate: number;
  }> {
    this.logger.debug('获取同步统计信息');
    return this.integrationService.getSyncStatistics();
  }

  /**
   * 获取GitLab项目列表
   */
  @Get('instances/:instanceId/projects')
  @Roles('project_admin', 'system_admin')
  @ApiOperation({ summary: '获取GitLab项目列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 20 })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键�? })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              path_with_namespace: { type: 'string' },
              description: { type: 'string' },
              visibility: { type: 'string' },
              web_url: { type: 'string' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'GitLab实例不存�?,
  })
  async getGitLabProjects(
    @Param('instanceId') instanceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ): Promise<{
    projects: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    this.logger.debug(`获取GitLab项目列表: ${instanceId}`, { page, limit, search });
    
    // 这里需要调用GitLab API服务获取项目列表
    // 由于这是示例，我们返回模拟数�?
    return {
      projects: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  // ==================== 同步管理 ====================

  /**
   * 执行增量同步
   */
  @Post('instances/:id/sync/incremental')
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
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  async performIncrementalSync(
    @Param('id') instanceId: string,
    @Body() body: { projectId?: string },
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
  }> {
    this.logger.log(`执行增量同步: ${instanceId}`, { instanceId, projectId: body.projectId });
    return this.incrementalSyncService.performIncrementalSync(instanceId, body.projectId);
  }

  /**
   * 执行全量同步
   */
  @Post('instances/:id/sync/full')
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
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  async performFullSync(
    @Param('id') instanceId: string,
    @Body() body: { projectId?: string },
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
  }> {
    this.logger.log(`执行全量同步: ${instanceId}`, { instanceId, projectId: body.projectId });
    return this.incrementalSyncService.performFullSync(instanceId, body.projectId);
  }

  /**
   * 执行补偿同步
   */
  @Post('instances/:id/sync/compensation')
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
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  async performCompensationSync(
    @Param('id') instanceId: string,
    @Body() body: { fromDate: string; toDate: string },
  ): Promise<{
    success: boolean;
    message: string;
    syncCount: number;
    lastSyncAt: Date;
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

  // ==================== 用户同步管理 ====================

  /**
   * 同步GitLab用户
   */
  @Post('instances/:id/users/sync')
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
            },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例不存�?,
  })
  async syncUsers(
    @Param('id') instanceId: string,
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
  @Get('instances/:id/users/statistics')
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
    description: '实例不存�?,
  })
  async getUserMappingStatistics(
    @Param('id') instanceId: string,
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
   * 清理无效的用户映�?
   */
  @Post('instances/:id/users/cleanup')
  @Roles('system_admin')
  @ApiOperation({ summary: '清理无效的用户映�? })
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
    description: '实例不存�?,
  })
  async cleanupInvalidMappings(
    @Param('id') instanceId: string,
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
    description: '事件不存�?,
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
   * 获取事件处理健康状�?
   */
  @Get('events/health')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取事件处理健康状�? })
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
    this.logger.debug('获取事件处理健康状�?);
    return this.eventProcessorService.getHealthStatus();
  }
}
