import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabApiService } from './gitlab-api.service';
import { GitLabWebhookService } from './gitlab-webhook.service';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../entities/gitlab-project-mapping.entity';
import { GitLabEventLog } from '../entities/gitlab-event-log.entity';
import { IssueEntity as Issue } from '../../issues/issue.entity';
import { ProjectEntity as Project } from '../../projects/project.entity';
import { UserEntity as User } from '../../users/user.entity';
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

// 错误处理辅助函数
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * GitLab同步服务
 * 负责处理GitLab事件与项目管理工具的数据同步
 */
@Injectable()
export class GitLabSyncService {
  private readonly logger = new Logger(GitLabSyncService.name);
  private readonly defaultSyncConfig: SyncConfig = {
    maxRetries: 3,
    batchSize: 100,
    timeout: 30000,
    retryInterval: 5000,
    enableAutoSync: true,
    syncInterval: 300000, // 5分钟
  };

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly mappingRepository: Repository<GitLabProjectMapping>,
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
    instance: GitLabInstance,
    event: GitLabPushEvent,
  ): Promise<EventProcessResult> {
    try {
      this.logger.log(`处理Push事件: ${event.project.name} - ${event.ref}`);

      // 查找项目映射
      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        this.logger.warn(`未找到项目映射: ${event.project.id}`);
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 处理提交信息
      const results = await this.processCommits(mapping, event.commits);

      return {
        success: true,
        message: `处理了 ${results.length} 个提交`,
        data: { results },
        retryable: false,
      };
    } catch (error) {
      this.logger.error(`处理Push事件失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        retryable: true,
      };
    }
  }

  /**
   * 处理Merge Request事件
   */
  async handleMergeRequestEvent(
    instance: GitLabInstance,
    event: GitLabMergeRequestEvent,
  ): Promise<EventProcessResult> {
    try {
      this.logger.log(`处理Merge Request事件: ${event.object_attributes.title}`);

      // 查找项目映射
      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        this.logger.warn(`未找到项目映射: ${event.project.id}`);
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 同步Merge Request
      const result = await this.syncMergeRequest(mapping, event.object_attributes);

      return {
        success: true,
        message: 'Merge Request同步成功',
        data: { issueId: result.id, action: 'merged' },
        retryable: false,
      };
    } catch (error) {
      this.logger.error(`处理Merge Request事件失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        retryable: true,
      };
    }
  }

  /**
   * 处理Issue事件
   */
  async handleIssueEvent(
    instance: GitLabInstance,
    event: GitLabIssueEvent,
  ): Promise<EventProcessResult> {
    try {
      this.logger.log(`处理Issue事件: ${event.object_attributes.title}`);

      // 查找项目映射
      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        this.logger.warn(`未找到项目映射: ${event.project.id}`);
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 同步Issue
      const result = await this.syncGitLabIssue(mapping, event.object_attributes);

      return {
        success: true,
        message: 'Issue同步成功',
        data: { issueId: result.id, action: 'created' },
        retryable: false,
      };
    } catch (error) {
      this.logger.error(`处理Issue事件失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        retryable: true,
      };
    }
  }

  /**
   * 处理Pipeline事件
   */
  async handlePipelineEvent(
    instance: GitLabInstance,
    event: GitLabPipelineEvent,
  ): Promise<EventProcessResult> {
    try {
      this.logger.log(`处理Pipeline事件: ${event.object_attributes.status}`);

      // 查找项目映射
      const mapping = await this.findProjectMapping(instance.id, event.project.id);
      if (!mapping) {
        this.logger.warn(`未找到项目映射: ${event.project.id}`);
        return {
          success: false,
          message: '未找到项目映射',
          retryable: false,
        };
      }

      // 根据Pipeline状态更新相关任务
      const results = await this.updateTasksByPipeline(mapping, event.object_attributes);

      return {
        success: true,
        message: `根据Pipeline更新了 ${results.length} 个任务`,
        data: { results },
        retryable: false,
      };
    } catch (error) {
      this.logger.error(`处理Pipeline事件失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        projectId: event.project.id,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        retryable: true,
      };
    }
  }

  /**
   * 处理提交信息
   */
  private async processCommits(mapping: GitLabProjectMapping, commits: GitLabCommit[]): Promise<any[]> {
    const results = [];

    for (const commit of commits) {
      try {
        // 查找相关的Issue
        const issues = await this.findIssuesByCommitMessage(mapping, commit.message);
        
        for (const issue of issues) {
          // 更新Issue状态
          const newState = this.determineStateFromCommit(commit.message);
          if (newState) {
            await this.updateTask(issue, newState, commit);
            results.push({ issueId: issue.id, newState });
          }
        }
      } catch (error) {
        this.logger.error(`处理提交失败: ${getErrorMessage(error)}`, {
          mappingId: mapping.id,
          commitId: commit.id,
          error: getErrorStack(error),
        });
      }
    }

    return results;
  }

  /**
   * 根据提交信息查找相关Issue
   */
  private async findIssuesByCommitMessage(mapping: GitLabProjectMapping, message: string): Promise<Issue[]> {
    // 从提交信息中提取Issue引用（如 #123, closes #456 等）
    const issueRefs = this.extractIssueReferences(message);
    
    if (issueRefs.length === 0) {
      return [];
    }

    // 查找对应的Issue
    const issues = await this.issueRepository.find({
      where: issueRefs.map(ref => ({ id: ref })),
    });

    return issues;
  }

  /**
   * 从提交信息中提取Issue引用
   */
  private extractIssueReferences(message: string): string[] {
    const patterns = [
      /#(\d+)/g,  // #123
      /closes\s+#(\d+)/gi,  // closes #123
      /fixes\s+#(\d+)/gi,   // fixes #123
      /resolves\s+#(\d+)/gi, // resolves #123
    ];

    const refs = new Set<string>();
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        refs.add(match[1]);
      }
    }

    return Array.from(refs);
  }

  /**
   * 根据提交信息确定新状态
   */
  private determineStateFromCommit(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('close') || lowerMessage.includes('fix')) {
      return 'completed';
    }
    if (lowerMessage.includes('wip') || lowerMessage.includes('work in progress')) {
      return 'in_progress';
    }
    if (lowerMessage.includes('review') || lowerMessage.includes('ready')) {
      return 'review';
    }
    
    return null;
  }

  /**
   * 更新任务状态
   */
  private async updateTask(issue: Issue, newState: string, commit: GitLabCommit): Promise<void> {
    try {
      // 更新Issue状态
      issue.state = newState;
      issue.updatedAt = new Date();
      
      // 添加GitLab相关信息
      // GitLab相关属性暂不存储到Issue实体中
      // issue.gitlabCommitSha = commit.id;
      // issue.gitlabUrl = commit.web_url;
      
      await this.issueRepository.save(issue);
      
      this.logger.log(`任务状态已更新: ${issue.id} -> ${newState}`);
    } catch (error) {
      this.logger.error(`更新任务失败: ${getErrorMessage(error)}`, {
        issueId: issue.id,
        newState,
        error: getErrorStack(error),
      });
      throw error;
    }
  }

  /**
   * 同步GitLab Issue
   */
  private async syncGitLabIssue(mapping: GitLabProjectMapping, gitlabIssue: GitLabIssue): Promise<Issue> {
    try {
      // 查找现有Issue
      let issue = await this.issueRepository.findOne({
        where: {
          // gitlabIssueId: gitlabIssue.id,
        },
      });

      if (issue) {
        // 更新现有Issue
        issue.title = gitlabIssue.title;
        issue.description = gitlabIssue.description;
        issue.state = this.mapGitLabStateToIssueState(gitlabIssue.state);
        // issue.gitlabUrl = gitlabIssue.web_url;
        issue.updatedAt = new Date();
      } else {
        // 创建新Issue
        issue = this.issueRepository.create({
          title: gitlabIssue.title,
          description: gitlabIssue.description,
          state: this.mapGitLabStateToIssueState(gitlabIssue.state),
          projectId: mapping.projectId,
          // gitlabIssueId: gitlabIssue.id,
          // gitlabUrl: gitlabIssue.web_url,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await this.issueRepository.save(issue);
    } catch (error) {
      this.logger.error(`同步GitLab Issue失败: ${getErrorMessage(error)}`, {
        mappingId: mapping.id,
        // gitlabIssueId: gitlabIssue.id,
        error: getErrorStack(error),
      });
      throw error;
    }
  }

  /**
   * 同步Merge Request
   */
  private async syncMergeRequest(mapping: GitLabProjectMapping, mergeRequest: GitLabMergeRequest): Promise<Issue> {
    try {
      // 查找现有Issue
      let issue = await this.issueRepository.findOne({
        where: {
          // gitlabMergeRequestId: mergeRequest.id,
        },
      });

      if (issue) {
        // 更新现有Issue
        issue.title = mergeRequest.title;
        issue.description = mergeRequest.description;
        issue.state = this.mapGitLabStateToIssueState(mergeRequest.state);
        // issue.gitlabUrl = mergeRequest.web_url;
        issue.updatedAt = new Date();
      } else {
        // 创建新Issue
        issue = this.issueRepository.create({
          title: mergeRequest.title,
          description: mergeRequest.description,
          state: this.mapGitLabStateToIssueState(mergeRequest.state),
          projectId: mapping.projectId,
          // gitlabMergeRequestId: mergeRequest.id,
          // gitlabUrl: mergeRequest.web_url,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await this.issueRepository.save(issue);
    } catch (error) {
      this.logger.error(`同步Merge Request失败: ${getErrorMessage(error)}`, {
        mappingId: mapping.id,
        mergeRequestId: mergeRequest.id,
        error: getErrorStack(error),
      });
      throw error;
    }
  }

  /**
   * 根据Pipeline更新任务
   */
  private async updateTasksByPipeline(mapping: GitLabProjectMapping, pipeline: GitLabPipeline): Promise<any[]> {
    const results = [];

    try {
      // 查找相关的Issue
      const issues = await this.issueRepository.find({
        where: {
          projectId: mapping.projectId,
        },
      });

      for (const issue of issues) {
        const newState = this.determineStateFromPipeline(pipeline.status);
        if (newState) {
          issue.state = newState;
          // issue.gitlabUrl = pipeline.web_url;
          issue.updatedAt = new Date();
          
          await this.issueRepository.save(issue);
          results.push({ issueId: issue.id, newState });
        }
      }
    } catch (error) {
      this.logger.error(`根据Pipeline更新任务失败: ${getErrorMessage(error)}`, {
        mappingId: mapping.id,
        pipelineId: pipeline.id,
        error: getErrorStack(error),
      });
    }

    return results;
  }

  /**
   * 根据Pipeline状态确定Issue状态
   */
  private determineStateFromPipeline(status: string): string | null {
    switch (status) {
      case 'success':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'running':
        return 'in_progress';
      case 'pending':
        return 'pending';
      default:
        return null;
    }
  }

  /**
   * 映射GitLab状态到Issue状态
   */
  private mapGitLabStateToIssueState(gitlabState: string): string {
    const stateMap: { [key: string]: string } = {
      'opened': 'open',
      'closed': 'completed',
      'merged': 'completed',
      'reopened': 'open',
    };

    return stateMap[gitlabState] || 'open';
  }

  /**
   * 查找项目映射
   */
  private async findProjectMapping(instanceId: string, gitlabProjectId: number): Promise<GitLabProjectMapping | null> {
    return await this.mappingRepository.findOne({
      where: {
        gitlabInstanceId: instanceId,
        gitlabProjectId: gitlabProjectId,
        isActive: true,
      },
    });
  }
}