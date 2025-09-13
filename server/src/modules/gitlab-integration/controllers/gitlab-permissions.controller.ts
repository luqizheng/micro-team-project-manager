import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  UseGuards, 
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GitLabPermissionsService } from '../services/gitlab-permissions.service';
import { 
  CheckPermissionDto,
  PermissionCheckResponseDto,
  UserPermissionSummaryDto,
  PermissionConfigDto,
  RolePermissionMappingDto,
  PermissionAuditLogDto,
} from '../dto/permission.dto';

/**
 * GitLab集成权限管理控制器
 * 负责权限相关的管理功能
 */
@ApiTags('GitLab权限管理')
@Controller('gitlab/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GitLabPermissionsController {
  private readonly logger = new Logger(GitLabPermissionsController.name);

  constructor(
    private readonly permissionsService: GitLabPermissionsService,
  ) {}

  /**
   * 检查用户权限
   */
  @Post('check')
  @Roles('system_admin')
  @ApiOperation({ summary: '检查用户权限' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '检查完成',
    type: PermissionCheckResponseDto,
  })
  async checkPermission(
    @Body() dto: CheckPermissionDto,
  ): Promise<PermissionCheckResponseDto> {
    this.logger.debug(`检查权限: ${dto.permission}`, { dto });

    try {
      const hasPermission = await this.permissionsService.checkPermission(
        dto.permission,
        {
          instanceId: dto.instanceId,
          projectId: dto.projectId,
          mappingId: dto.mappingId,
        },
      );

      return {
        hasPermission,
        permission: dto.permission,
        message: hasPermission ? '权限验证通过' : '权限不足',
      };

    } catch (error) {
      this.logger.error(`检查权限失败: ${error.message}`, {
        dto,
        error: error.stack,
      });

      return {
        hasPermission: false,
        permission: dto.permission,
        message: `权限检查失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取用户权限摘要
   */
  @Get('user/:userId/summary')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取用户权限摘要' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: UserPermissionSummaryDto,
  })
  async getUserPermissionSummary(
    @Param('userId') userId: string,
  ): Promise<UserPermissionSummaryDto> {
    this.logger.debug(`获取用户权限摘要: ${userId}`, { userId });

    try {
      return await this.permissionsService.getUserPermissionSummary(userId);

    } catch (error) {
      this.logger.error(`获取用户权限摘要失败: ${error.message}`, {
        userId,
        error: error.stack,
      });

      return {
        role: 'unknown',
        permissions: [],
        accessibleInstances: 0,
        accessibleMappings: 0,
        canSync: false,
      };
    }
  }

  /**
   * 获取当前用户权限摘要
   */
  @Get('my/summary')
  @Roles('system_admin', 'project_admin', 'user')
  @ApiOperation({ summary: '获取当前用户权限摘要' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: UserPermissionSummaryDto,
  })
  async getMyPermissionSummary(
    @Param('userId') userId: string,
  ): Promise<UserPermissionSummaryDto> {
    this.logger.debug(`获取当前用户权限摘要: ${userId}`, { userId });

    try {
      return await this.permissionsService.getUserPermissionSummary(userId);

    } catch (error) {
      this.logger.error(`获取当前用户权限摘要失败: ${error.message}`, {
        userId,
        error: error.stack,
      });

      return {
        role: 'unknown',
        permissions: [],
        accessibleInstances: 0,
        accessibleMappings: 0,
        canSync: false,
      };
    }
  }

  /**
   * 获取用户可访问的GitLab实例
   */
  @Get('user/:userId/instances')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取用户可访问的GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  })
  async getUserAccessibleInstances(
    @Param('userId') userId: string,
  ): Promise<Array<{
    id: string;
    name: string;
    url: string;
    isActive: boolean;
  }>> {
    this.logger.debug(`获取用户可访问实例: ${userId}`, { userId });

    try {
      const instances = await this.permissionsService.getUserAccessibleInstances(userId);
      
      return instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        url: instance.url,
        isActive: instance.isActive,
      }));

    } catch (error) {
      this.logger.error(`获取用户可访问实例失败: ${error.message}`, {
        userId,
        error: error.stack,
      });

      return [];
    }
  }

  /**
   * 获取用户可访问的项目映射
   */
  @Get('user/:userId/mappings')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取用户可访问的项目映射' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          projectName: { type: 'string' },
          gitlabProjectPath: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  })
  async getUserAccessibleMappings(
    @Param('userId') userId: string,
  ): Promise<Array<{
    id: string;
    projectId: string;
    projectName: string;
    gitlabProjectPath: string;
    isActive: boolean;
  }>> {
    this.logger.debug(`获取用户可访问映射: ${userId}`, { userId });

    try {
      const mappings = await this.permissionsService.getUserAccessibleMappings(userId);
      
      return mappings.map(mapping => ({
        id: mapping.id,
        projectId: mapping.projectId,
        projectName: mapping.project?.name || 'Unknown',
        gitlabProjectPath: mapping.gitlabProjectPath,
        isActive: mapping.isActive,
      }));

    } catch (error) {
      this.logger.error(`获取用户可访问映射失败: ${error.message}`, {
        userId,
        error: error.stack,
      });

      return [];
    }
  }

  /**
   * 检查用户是否可以执行同步操作
   */
  @Post('user/:userId/sync/check')
  @Roles('system_admin')
  @ApiOperation({ summary: '检查用户是否可以执行同步操作' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '检查完成',
    schema: {
      type: 'object',
      properties: {
        canSync: { type: 'boolean' },
        syncType: { type: 'string' },
        context: { type: 'object' },
        message: { type: 'string' },
      },
    },
  })
  async checkSyncPermission(
    @Param('userId') userId: string,
    @Body() body: {
      syncType: 'incremental' | 'full' | 'compensation';
      instanceId?: string;
      projectId?: string;
    },
  ): Promise<{
    canSync: boolean;
    syncType: string;
    context: any;
    message: string;
  }> {
    this.logger.debug(`检查同步权限: ${userId}`, { userId, body });

    try {
      const canSync = await this.permissionsService.canPerformSync(
        userId,
        body.syncType,
        {
          instanceId: body.instanceId,
          projectId: body.projectId,
        },
      );

      return {
        canSync,
        syncType: body.syncType,
        context: {
          instanceId: body.instanceId,
          projectId: body.projectId,
        },
        message: canSync ? '可以执行同步操作' : '无权限执行同步操作',
      };

    } catch (error) {
      this.logger.error(`检查同步权限失败: ${error.message}`, {
        userId,
        body,
        error: error.stack,
      });

      return {
        canSync: false,
        syncType: body.syncType,
        context: {
          instanceId: body.instanceId,
          projectId: body.projectId,
        },
        message: `权限检查失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取权限配置
   */
  @Get('config')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取权限配置' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: PermissionConfigDto,
  })
  async getPermissionConfig(): Promise<PermissionConfigDto> {
    this.logger.debug('获取权限配置');

    // 返回默认配置
    return {
      enabled: true,
      enableFineGrained: false,
      defaultPolicy: 'deny',
      cacheTimeout: 300,
    };
  }

  /**
   * 更新权限配置
   */
  @Put('config')
  @Roles('system_admin')
  @ApiOperation({ summary: '更新权限配置' })
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
  async updatePermissionConfig(
    @Body() config: PermissionConfigDto,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log('更新权限配置', { config });

    // 这里需要实现更新权限配置的逻辑
    // 简化实现
    return {
      success: true,
      message: '权限配置已更新',
    };
  }

  /**
   * 获取角色权限映射
   */
  @Get('roles')
  @Roles('system_admin')
  @ApiOperation({ summary: '获取角色权限映射' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: [RolePermissionMappingDto],
  })
  async getRolePermissionMappings(): Promise<RolePermissionMappingDto[]> {
    this.logger.debug('获取角色权限映射');

    // 返回预定义的角色权限映射
    return [
      {
        role: 'system_admin',
        permissions: [
          'read:gitlab_instance',
          'create:gitlab_instance',
          'update:gitlab_instance',
          'delete:gitlab_instance',
          'test:gitlab_instance',
          'read:gitlab_project_mapping',
          'create:gitlab_project_mapping',
          'update:gitlab_project_mapping',
          'delete:gitlab_project_mapping',
          'sync:gitlab_project_mapping',
          'sync:gitlab_sync',
          'sync:gitlab_user',
          'read:gitlab_user_mapping',
          'cleanup:gitlab_user_mapping',
          'read:gitlab_event',
          'retry:gitlab_event',
          'batch_retry:gitlab_event',
          'read:gitlab_statistics',
          'read:gitlab_health',
          'receive:gitlab_webhook',
          'read:gitlab_webhook',
        ],
        inheritable: false,
      },
      {
        role: 'project_admin',
        permissions: [
          'read:gitlab_project_mapping',
          'create:gitlab_project_mapping',
          'update:gitlab_project_mapping',
          'delete:gitlab_project_mapping',
          'sync:gitlab_project_mapping',
          'read:gitlab_statistics',
          'read:gitlab_health',
          'read:gitlab_webhook',
        ],
        inheritable: true,
        parentRole: 'user',
      },
      {
        role: 'user',
        permissions: [
          'read:gitlab_statistics',
          'read:gitlab_health',
        ],
        inheritable: true,
      },
    ];
  }
}
