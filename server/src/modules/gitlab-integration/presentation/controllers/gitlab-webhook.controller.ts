/**
 * GitLab Webhook控制器
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

/**
 * GitLab Webhook控制器
 * 负责处理来自GitLab的Webhook事件
 */
@ApiTags('GitLab Webhook')
@Controller('gitlab/webhook')
@UseFilters(GitLabExceptionFilter)
export class GitLabWebhookController {
  private readonly logger = new Logger(GitLabWebhookController.name);

  constructor(
    private readonly webhookService: GitLabWebhookService,
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
    @Headers('x-gitlab-token') token?: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`处理GitLab Webhook事件: ${eventType}, instanceId: ${instanceId}`);

    // 验证必需参数
    if (!eventType) {
      throw new BadRequestException('缺少X-Gitlab-Event头');
    }

    if (!instanceId) {
      throw new BadRequestException('缺少instanceId查询参数');
    }

    // 处理Webhook事件
    const result = this.webhookService.parseWebhookEvent(JSON.stringify({
      eventType,
      event,
      token,
      instanceId,
    }));

    this.logger.log(`Webhook事件处理完成: 成功`);
    
    return { success: true, message: 'Webhook事件处理成功' };
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
