import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabApiService } from './gitlab-api.service';
import { GitLabWebhookService } from './gitlab-webhook.service';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../entities/gitlab-project-mapping.entity';
import { GitLabEventLog } from '../entities/gitlab-event-log.entity';
import { Issue } from '../../issues/issue.entity';
import { Project } from '../../projects/project.entity';
import { User } from '../../users/user.entity';
import {
  GitLabPushEvent,
  GitLabMergeRequestEvent,
  GitLabIssueEvent,
  GitLabPipelineEvent,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabPipeline,
  GitLabCommit,
} from '../interfaces/gitlab-api.interface';
import {
  SyncResult,
  SyncConfig,
  EventProcessResult,
  SyncStatus,
} from '../interfaces/gitlab-sync.interface';

/**
 * GitLab同步服务
 * 负责处理GitLab事件与项目管理工具的数据同步
 */
@Injectable()
export class GitLabSyncService {
  private readonly logger = new Logger(GitLabSyncService.name);
  private readonly defaultSyncConfig: SyncConfig = {
    maxRetries: 5,
    retryInterval: 1000,
    batchSize: 10,
    timeout: 30000,
    enableAutoSync: true,
    syncInterval: 300000, // 5分钟
  };

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly gitlabInstanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly projectMappingRepository: Repository<GitLabProjectMapping>,
    @InjectRepository(GitLabEventLog)
    private readonly eventLogRepository: Repository<GitLabEventLog>,
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly gitlabApiService: GitLabApiService,
    private readonly webhookService: GitLabWebhookService,
  ) {}

  /**
   * 处理Push事件
   */
  async handlePushEvent(
    event: GitLabPushEvent,
    instance: GitLabInstance,
  ): Promise<EventProcessResult> {
    try {
      this.logger.debug(`处理Push事件: ${event.project.name}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        commitsCount: event.commits?.length || 0,
      });

      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 处理每个提交
      const results = [];
      for (const commit of event.commits || []) {
        const result = await this.processCommit(commit, mapping);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        message: `处理了 ${successCount}/${totalCount} 个提交`,
        data: { results },
        retryable: successCount < totalCount,
      };
    } catch (error) {
      this.logger.error(`处理Push事件失败: ${error.message}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 处理Merge Request事件
   */
  async handleMergeRequestEvent(
    event: GitLabMergeRequestEvent,
    instance: GitLabInstance,
  ): Promise<EventProcessResult> {
    try {
      this.logger.debug(`处理Merge Request事件: ${event.project.name}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        mergeRequestId: event.object_attributes.iid,
      });

      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 获取完整的Merge Request信息
      const mergeRequest = await this.gitlabApiService.getMergeRequest(
        instance,
        event.project.id,
        event.object_attributes.iid,
      );

      // 同步Merge Request到Issue
      const result = await this.syncMergeRequestToIssue(mergeRequest, mapping);

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        retryable: !result.success,
      };
    } catch (error) {
      this.logger.error(`处理Merge Request事件失败: ${error.message}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 处理Issue事件
   */
  async handleIssueEvent(
    event: GitLabIssueEvent,
    instance: GitLabInstance,
  ): Promise<EventProcessResult> {
    try {
      this.logger.debug(`处理Issue事件: ${event.project.name}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        issueId: event.object_attributes.iid,
      });

      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 获取完整的Issue信息
      const issue = await this.gitlabApiService.getIssue(
        instance,
        event.project.id,
        event.object_attributes.iid,
      );

      // 同步Issue
      const result = await this.syncGitLabIssue(issue, mapping);

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        retryable: !result.success,
      };
    } catch (error) {
      this.logger.error(`处理Issue事件失败: ${error.message}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 处理Pipeline事件
   */
  async handlePipelineEvent(
    event: GitLabPipelineEvent,
    instance: GitLabInstance,
  ): Promise<EventProcessResult> {
    try {
      this.logger.debug(`处理Pipeline事件: ${event.project.name}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        pipelineId: event.object_attributes.id,
      });

      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 获取完整的Pipeline信息
      const pipeline = await this.gitlabApiService.getPipeline(
        instance,
        event.project.id,
        event.object_attributes.id,
      );

      // 更新相关任务状态
      const result = await this.updateTaskFromPipeline(pipeline, mapping);

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        retryable: !result.success,
      };
    } catch (error) {
      this.logger.error(`处理Pipeline事件失败: ${error.message}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 处理提交
   */
  private async processCommit(
    commit: GitLabCommit,
    mapping: GitLabProjectMapping,
  ): Promise<EventProcessResult> {
    try {
      // 解析提交信息中的任务引用
      const taskReferences = this.extractTaskReferences(commit.message);
      
      if (taskReferences.length === 0) {
        return {
          success: true,
          message: '提交信息中未包含任务引用',
          retryable: false,
        };
      }

      // 更新相关任务
      const results = [];
      for (const taskRef of taskReferences) {
        const result = await this.updateTaskFromCommit(commit, mapping, taskRef);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        message: `更新了 ${successCount}/${totalCount} 个任务`,
        data: { results },
        retryable: successCount < totalCount,
      };
    } catch (error) {
      this.logger.error(`处理提交失败: ${error.message}`, {
        commitSha: commit.id,
        mappingId: mapping.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 从提交信息中提取任务引用
   */
  private extractTaskReferences(commitMessage: string): string[] {
    const patterns = [
      /#(\w+-\d+)/g, // #TASK-123, #BUG-456
      /(\w+-\d+)/g,   // TASK-123, BUG-456
      /fixes?\s+#?(\w+-\d+)/gi, // fixes #TASK-123
      /closes?\s+#?(\w+-\d+)/gi, // closes #TASK-123
      /resolves?\s+#?(\w+-\d+)/gi, // resolves #TASK-123
    ];

    const references = new Set<string>();
    
    for (const pattern of patterns) {
      const matches = commitMessage.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const ref = match.replace(/[#\s]/g, '').toUpperCase();
          if (ref) {
            references.add(ref);
          }
        });
      }
    }

    return Array.from(references);
  }

  /**
   * 根据提交更新任务
   */
  private async updateTaskFromCommit(
    commit: GitLabCommit,
    mapping: GitLabProjectMapping,
    taskRef: string,
  ): Promise<EventProcessResult> {
    try {
      // 查找对应的任务
      const issue = await this.issueRepository.findOne({
        where: {
          projectId: mapping.projectId,
          // 这里需要根据实际的任务编号规则来查找
          // 假设任务编号存储在某个字段中
        },
      });

      if (!issue) {
        return {
          success: false,
          message: `未找到任务: ${taskRef}`,
          retryable: false,
        };
      }

      // 更新任务状态
      const newState = this.mapCommitToTaskState(commit);
      if (newState && newState !== issue.state) {
        issue.state = newState;
        issue.gitlabCommitSha = commit.id;
        issue.gitlabUrl = commit.web_url;
        await this.issueRepository.save(issue);

        return {
          success: true,
          message: `任务 ${taskRef} 状态已更新为 ${newState}`,
          data: { issueId: issue.id, newState },
        };
      }

      return {
        success: true,
        message: `任务 ${taskRef} 状态无需更新`,
        data: { issueId: issue.id },
      };
    } catch (error) {
      this.logger.error(`更新任务失败: ${error.message}`, {
        taskRef,
        commitSha: commit.id,
        mappingId: mapping.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 映射提交到任务状态
   */
  private mapCommitToTaskState(commit: GitLabCommit): string | null {
    const message = commit.message.toLowerCase();
    
    if (message.includes('done') || message.includes('complete') || message.includes('finish')) {
      return 'Done';
    }
    if (message.includes('fix') || message.includes('resolve')) {
      return 'In Review';
    }
    if (message.includes('start') || message.includes('begin')) {
      return 'In Progress';
    }
    
    return null;
  }

  /**
   * 同步GitLab Issue到项目管理工具
   */
  private async syncGitLabIssue(
    gitlabIssue: GitLabIssue,
    mapping: GitLabProjectMapping,
  ): Promise<EventProcessResult> {
    try {
      // 查找现有任务
      let issue = await this.issueRepository.findOne({
        where: {
          projectId: mapping.projectId,
          gitlabIssueId: gitlabIssue.id,
        },
      });

      if (issue) {
        // 更新现有任务
        issue.title = gitlabIssue.title;
        issue.description = gitlabIssue.description || '';
        issue.state = this.mapGitLabIssueState(gitlabIssue.state);
        issue.gitlabUrl = gitlabIssue.web_url;
        await this.issueRepository.save(issue);

        return {
          success: true,
          message: `任务已更新: ${gitlabIssue.title}`,
          data: { issueId: issue.id, action: 'updated' },
        };
      } else {
        // 创建新任务
        issue = this.issueRepository.create({
          projectId: mapping.projectId,
          type: 'task',
          title: gitlabIssue.title,
          description: gitlabIssue.description || '',
          state: this.mapGitLabIssueState(gitlabIssue.state),
          priority: 'medium',
          assigneeId: null, // 需要映射GitLab用户
          reporterId: null, // 需要映射GitLab用户
          gitlabIssueId: gitlabIssue.id,
          gitlabUrl: gitlabIssue.web_url,
        });

        await this.issueRepository.save(issue);

        return {
          success: true,
          message: `任务已创建: ${gitlabIssue.title}`,
          data: { issueId: issue.id, action: 'created' },
        };
      }
    } catch (error) {
      this.logger.error(`同步GitLab Issue失败: ${error.message}`, {
        gitlabIssueId: gitlabIssue.id,
        mappingId: mapping.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 同步Merge Request到Issue
   */
  private async syncMergeRequestToIssue(
    mergeRequest: GitLabMergeRequest,
    mapping: GitLabProjectMapping,
  ): Promise<EventProcessResult> {
    try {
      // 查找现有任务
      let issue = await this.issueRepository.findOne({
        where: {
          projectId: mapping.projectId,
          gitlabMergeRequestId: mergeRequest.id,
        },
      });

      if (issue) {
        // 更新现有任务
        issue.title = mergeRequest.title;
        issue.description = mergeRequest.description || '';
        issue.state = this.mapGitLabMergeRequestState(mergeRequest.state);
        issue.gitlabUrl = mergeRequest.web_url;
        await this.issueRepository.save(issue);

        return {
          success: true,
          message: `任务已更新: ${mergeRequest.title}`,
          data: { issueId: issue.id, action: 'updated' },
        };
      } else {
        // 创建新任务
        issue = this.issueRepository.create({
          projectId: mapping.projectId,
          type: 'task',
          title: mergeRequest.title,
          description: mergeRequest.description || '',
          state: this.mapGitLabMergeRequestState(mergeRequest.state),
          priority: 'medium',
          assigneeId: null, // 需要映射GitLab用户
          reporterId: null, // 需要映射GitLab用户
          gitlabMergeRequestId: mergeRequest.id,
          gitlabUrl: mergeRequest.web_url,
        });

        await this.issueRepository.save(issue);

        return {
          success: true,
          message: `任务已创建: ${mergeRequest.title}`,
          data: { issueId: issue.id, action: 'created' },
        };
      }
    } catch (error) {
      this.logger.error(`同步Merge Request失败: ${error.message}`, {
        mergeRequestId: mergeRequest.id,
        mappingId: mapping.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 根据Pipeline更新任务
   */
  private async updateTaskFromPipeline(
    pipeline: GitLabPipeline,
    mapping: GitLabProjectMapping,
  ): Promise<EventProcessResult> {
    try {
      // 查找相关任务
      const issues = await this.issueRepository.find({
        where: {
          projectId: mapping.projectId,
          gitlabPipelineId: pipeline.id,
        },
      });

      if (issues.length === 0) {
        return {
          success: true,
          message: '未找到相关任务',
          retryable: false,
        };
      }

      // 更新任务状态
      const newState = this.mapGitLabPipelineState(pipeline.status);
      const results = [];

      for (const issue of issues) {
        if (newState && newState !== issue.state) {
          issue.state = newState;
          issue.gitlabUrl = pipeline.web_url;
          await this.issueRepository.save(issue);
          results.push({ issueId: issue.id, newState });
        }
      }

      return {
        success: true,
        message: `更新了 ${results.length} 个任务`,
        data: { results },
      };
    } catch (error) {
      this.logger.error(`根据Pipeline更新任务失败: ${error.message}`, {
        pipelineId: pipeline.id,
        mappingId: mapping.id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        error: error.stack,
        retryable: true,
      };
    }
  }

  /**
   * 映射GitLab Issue状态
   */
  private mapGitLabIssueState(gitlabState: string): string {
    switch (gitlabState) {
      case 'opened':
        return 'New';
      case 'closed':
        return 'Done';
      default:
        return 'New';
    }
  }

  /**
   * 映射GitLab Merge Request状态
   */
  private mapGitLabMergeRequestState(gitlabState: string): string {
    switch (gitlabState) {
      case 'opened':
        return 'In Progress';
      case 'merged':
        return 'Done';
      case 'closed':
        return 'Cancelled';
      default:
        return 'In Progress';
    }
  }

  /**
   * 映射GitLab Pipeline状态
   */
  private mapGitLabPipelineState(gitlabStatus: string): string | null {
    switch (gitlabStatus) {
      case 'success':
        return 'Done';
      case 'failed':
        return 'Blocked';
      case 'running':
        return 'In Progress';
      case 'pending':
        return 'In Progress';
      default:
        return null;
    }
  }

  /**
   * 查找项目映射
   */
  private async findProjectMapping(
    instanceId: string,
    gitlabProjectId: number,
  ): Promise<GitLabProjectMapping | null> {
    return this.projectMappingRepository.findOne({
      where: {
        gitlabInstanceId: instanceId,
        gitlabProjectId: gitlabProjectId,
        isActive: true,
      },
      relations: ['project', 'gitlabInstance'],
    });
  }
}
