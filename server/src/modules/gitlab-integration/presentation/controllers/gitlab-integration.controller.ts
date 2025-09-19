/**
 * GitLab集成控制器
 * 负责GitLab实例和项目映射的管理API
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
  HttpException,
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
import { GitLabIntegrationService } from '../../application/services/gitlab-integration.service';
import { GitLabExceptionFilter } from '../../shared/middleware/gitlab-exception.filter';
import {
  CreateGitLabInstanceDto,
  UpdateGitLabInstanceDto,
  CreateGroupMappingDto,
  UpdateGroupMappingDto,
  GitLabInstanceResponseDto,
  GroupMappingResponseDto,
} from '../dto';

/**
 * GitLab集成管理控制器
 * 负责GitLab实例和项目映射的管理
 */
@ApiTags('GitLab集成管理')
@Controller('gitlab')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseFilters(GitLabExceptionFilter)
export class GitLabIntegrationController {
  private readonly logger = new Logger(GitLabIntegrationController.name);

  constructor(
    private readonly integrationService: GitLabIntegrationService,
  ) {}

  // ==================== 实例管理 ====================

  /**
   * 创建GitLab实例
   */
  @Post('instances')
  @Roles('admin')
  @ApiOperation({ summary: '创建GitLab实例' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '创建成功',
    type: GitLabInstanceResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数无效' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '实例已存在' 
  })
  async createInstance(@Body() dto: CreateGitLabInstanceDto): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`创建GitLab实例: ${dto.name}`);
    return await this.integrationService.createInstance(dto);
  }

  /**
   * 更新GitLab实例
   */
  @Put('instances/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新GitLab实例' })
  @ApiParam({ name: 'id', description: '实例ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功',
    type: GitLabInstanceResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例未找到' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数无效' 
  })
  async updateInstance(
    @Param('id') id: string,
    @Body() dto: UpdateGitLabInstanceDto,
  ): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`更新GitLab实例: ${id}`);
    return await this.integrationService.updateInstance(id, dto);
  }

  /**
   * 删除GitLab实例
   */
  @Delete('instances/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除GitLab实例' })
  @ApiParam({ name: 'id', description: '实例ID' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: '删除成功' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例未找到' 
  })
  async deleteInstance(@Param('id') id: string): Promise<void> {
    this.logger.log(`删除GitLab实例: ${id}`);
    await this.integrationService.deleteInstance(id);
  }

  /**
   * 获取GitLab实例
   */
  @Get('instances/:id')
  @Roles('admin', 'member')
  @ApiOperation({ summary: '获取GitLab实例' })
  @ApiParam({ name: 'id', description: '实例ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: GitLabInstanceResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '实例未找到' 
  })
  async getInstance(@Param('id') id: string): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`获取GitLab实例: ${id}`);
    return await this.integrationService.getInstance(id);
  }

  /**
   * 获取所有GitLab实例
   */
  @Get('instances')
  @Roles('admin', 'member')
  @ApiOperation({ summary: '获取所有GitLab实例' })
  @ApiQuery({ name: 'active', required: false, description: '是否只获取活跃实例' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: [GitLabInstanceResponseDto],
  })
  async listInstances(@Query('active') active?: boolean): Promise<GitLabInstanceResponseDto[]> {
    this.logger.log(`获取GitLab实例列表: active=${active}`);
    const instances = await this.integrationService.listInstances();
    
    if (active !== undefined) {
      return instances.filter(instance => instance.isActive === active);
    }
    
    return instances;
  }

  // ==================== 项目映射管理 ====================

  /**
   * 创建项目映射
   */
  @Post('project-mappings')
  @Roles('admin')
  @ApiOperation({ summary: '创建项目映射' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '创建成功',
    type: GroupMappingResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数无效' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: '映射已存在' 
  })
  async createProjectMapping(@Body() dto: CreateGroupMappingDto): Promise<GroupMappingResponseDto> {
    this.logger.log(`创建项目映射: ${dto.projectId} -> ${dto.gitlabGroupId}`);
    return await this.integrationService.createGroupMapping(dto);
  }

  /**
   * 更新项目映射
   */
  @Put('project-mappings/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新项目映射' })
  @ApiParam({ name: 'id', description: '映射ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '更新成功',
    type: GroupMappingResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射未找到' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数无效' 
  })
  async updateProjectMapping(
    @Param('id') id: string,
    @Body() dto: UpdateGroupMappingDto,
  ): Promise<GroupMappingResponseDto> {
    this.logger.log(`更新项目映射: ${id}`);
    return await this.integrationService.updateGroupMapping(id, dto);
  }

  /**
   * 删除项目映射
   */
  @Delete('project-mappings/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除项目映射' })
  @ApiParam({ name: 'id', description: '映射ID' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: '删除成功' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射未找到' 
  })
  async deleteProjectMapping(@Param('id') id: string): Promise<void> {
    this.logger.log(`删除项目映射: ${id}`);
    await this.integrationService.deleteGroupMapping(id);
  }

  /**
   * 获取项目映射
   */
  @Get('project-mappings/:id')
  @Roles('admin', 'member')
  @ApiOperation({ summary: '获取项目映射' })
  @ApiParam({ name: 'id', description: '映射ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: GroupMappingResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '映射未找到' 
  })
  async getProjectMapping(@Param('id') id: string): Promise<GroupMappingResponseDto> {
    this.logger.log(`获取项目映射: ${id}`);
    return await this.integrationService.getGroupMapping(id);
  }

  /**
   * 获取项目映射列表
   */
  @Get('project-mappings')
  @Roles('admin', 'member')
  @ApiOperation({ summary: '获取项目映射列表' })
  @ApiQuery({ name: 'instanceId', required: false, description: '实例ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '获取成功',
    type: [GroupMappingResponseDto],
  })
  async listProjectMappings(@Query('instanceId') instanceId?: string): Promise<GroupMappingResponseDto[]> {
    this.logger.log(`获取项目映射列表: instanceId=${instanceId}`);
    return await this.integrationService.listGroupMappings(instanceId);
  }

  // ==================== 健康检查 ====================

  /**
   * 健康检查
   */
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '服务正常' 
  })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
