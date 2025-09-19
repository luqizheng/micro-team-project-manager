/**
 * GitLab Webhook控制�?
 * 负责处理GitLab Webhook事件
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Query,
  Logger,
  HttpStatus,
  UseFilters,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { GitLabWebhookService } from '../../services/gitlab-webhook.service';
import { GitLabExceptionFilter } from '../../shared/middleware/gitlab-exception.filter';
import { GitLabWebhookEvent } from '../../core/types/webhook.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabInstance } from '../../core/entities/gitlab-instance.entity';

/**
 * GitLab Webhook控制�?
 * 负责处理来自GitLab的Webhook事件
 */
@ApiTags('GitLab Webhook')
@Controller('gitlab/webhook')
@UseFilters(GitLabExceptionFilter)
export class GitLabWebhookController {
  private readonly logger = new Logger(GitLabWebhookController.name);

  constructor(
    private readonly webhookService: GitLabWebhookService,
    @InjectRepository(GitLabInstance)
    private readonly gitlabInstanceRepository: Repository<GitLabInstance>,
  ) {}

  /**
   * 处理GitLab Webhook事件
   */
  @Post()
  @ApiOperation({ summary: '处理GitLab Webhook事件' })
  @ApiHeader({ 
    name: 'X-Gitlab-Event', 
    description: 'GitLab事件类型',
    required: true,
  })
  @ApiHeader({ 
    name: 'X-Gitlab-Token', 
    description: 'GitLab Webhook Token',
    required: false,
  })
  @ApiQuery({ 
    name: 'instanceId', 
    description: 'GitLab实例ID',
    required: true,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '事件处理成功' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数无效' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Token验证失败' 
  })
  async handleWebhook(
    @Body() event: GitLabWebhookEvent,
    @Headers('x-gitlab-event') eventType: string,
    @Headers('x-gitlab-token') token: string | undefined,
    @Query('instanceId') instanceId: string | undefined,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理GitLab Webhook事件: ${eventType}, instanceId: ${instanceId}`);

    // 验证必需参数
    if (!eventType) {
      throw new BadRequestException('缺少X-Gitlab-Event');
    }

    if (!instanceId) {
      throw new BadRequestException('缺少instanceId查询参数');
    }

    // 1) 根据 instanceId 查询实例
    const instance = await this.gitlabInstanceRepository.findOne({ where: { id: instanceId, isActive: true } });
    if (!instance) {
      throw new BadRequestException('GitLab实例不存在或未激活');
    }

    // 2) 校验 X-Gitlab-Token （GitLab 为明文等值校验）
    if (instance.webhookSecret) {
      if (!token || token !== instance.webhookSecret) {
        throw new UnauthorizedException('Webhook Token 校验失败');
      }
    }

    // 3) 解析原始 payload（必须包�?object_kind �?project）
    const parsed = this.webhookService.parseWebhookEvent(JSON.stringify(event));

    // 4) 调用服务处理
    const result = await this.webhookService.processWebhookEvent(instance, parsed);

    this.logger.log(`Webhook事件处理完成: ${result.success ? '成功' : '失败'}`);
    return result;
  }

  /**
   * 处理Push事件
   */
  @Post('push')
  @ApiOperation({ summary: '处理Push事件' })
  @ApiHeader({ 
    name: 'X-Gitlab-Event', 
    description: 'GitLab事件类型',
    required: true,
  })
  @ApiHeader({ 
    name: 'X-Gitlab-Token', 
    description: 'GitLab Webhook Token',
    required: false,
  })
  @ApiQuery({ 
    name: 'instanceId', 
    description: 'GitLab实例ID',
    required: true,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '事件处理成功' 
  })
  async handlePushEvent(
    @Body() event: GitLabWebhookEvent,
    @Headers('x-gitlab-event') eventType: string,
    @Headers('x-gitlab-token') token?: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理Push事件: instanceId: ${instanceId}`);
    return await this.handleWebhook(event, eventType, token, instanceId);
  }

  /**
   * 处理Issue事件
   */
  @Post('issue')
  @ApiOperation({ summary: '处理Issue事件' })
  @ApiHeader({ 
    name: 'X-Gitlab-Event', 
    description: 'GitLab事件类型',
    required: true,
  })
  @ApiHeader({ 
    name: 'X-Gitlab-Token', 
    description: 'GitLab Webhook Token',
    required: false,
  })
  @ApiQuery({ 
    name: 'instanceId', 
    description: 'GitLab实例ID',
    required: true,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '事件处理成功' 
  })
  async handleIssueEvent(
    @Body() event: GitLabWebhookEvent,
    @Headers('x-gitlab-event') eventType: string,
    @Headers('x-gitlab-token') token?: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理Issue事件: instanceId: ${instanceId}`);
    return await this.handleWebhook(event, eventType, token, instanceId);
  }

  /**
   * 处理Merge Request事件
   */
  @Post('merge-request')
  @ApiOperation({ summary: '处理Merge Request事件' })
  @ApiHeader({ 
    name: 'X-Gitlab-Event', 
    description: 'GitLab事件类型',
    required: true,
  })
  @ApiHeader({ 
    name: 'X-Gitlab-Token', 
    description: 'GitLab Webhook Token',
    required: false,
  })
  @ApiQuery({ 
    name: 'instanceId', 
    description: 'GitLab实例ID',
    required: true,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '事件处理成功' 
  })
  async handleMergeRequestEvent(
    @Body() event: GitLabWebhookEvent,
    @Headers('x-gitlab-event') eventType: string,
    @Headers('x-gitlab-token') token?: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理Merge Request事件: instanceId: ${instanceId}`);
    return await this.handleWebhook(event, eventType, token, instanceId);
  }

  /**
   * 处理Pipeline事件
   */
  @Post('pipeline')
  @ApiOperation({ summary: '处理Pipeline事件' })
  @ApiHeader({ 
    name: 'X-Gitlab-Event', 
    description: 'GitLab事件类型',
    required: true,
  })
  @ApiHeader({ 
    name: 'X-Gitlab-Token', 
    description: 'GitLab Webhook Token',
    required: false,
  })
  @ApiQuery({ 
    name: 'instanceId', 
    description: 'GitLab实例ID',
    required: true,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '事件处理成功' 
  })
  async handlePipelineEvent(
    @Body() event: GitLabWebhookEvent,
    @Headers('x-gitlab-event') eventType: string,
    @Headers('x-gitlab-token') token?: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理Pipeline事件: instanceId: ${instanceId}`);
    return await this.handleWebhook(event, eventType, token, instanceId);
  }

  /**
   * 处理Note事件
   */
  @Post('note')
  @ApiOperation({ summary: '处理Note事件' })
  @ApiHeader({ 
    name: 'X-Gitlab-Event', 
    description: 'GitLab事件类型',
    required: true,
  })
  @ApiHeader({ 
    name: 'X-Gitlab-Token', 
    description: 'GitLab Webhook Token',
    required: false,
  })
  @ApiQuery({ 
    name: 'instanceId', 
    description: 'GitLab实例ID',
    required: true,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '事件处理成功' 
  })
  async handleNoteEvent(
    @Body() event: GitLabWebhookEvent,
    @Headers('x-gitlab-event') eventType: string,
    @Headers('x-gitlab-token') token?: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理Note事件: instanceId: ${instanceId}`);
    return await this.handleWebhook(event, eventType, token, instanceId);
  }
}
