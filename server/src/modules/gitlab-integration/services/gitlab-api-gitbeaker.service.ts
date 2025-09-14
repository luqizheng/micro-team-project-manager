import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Gitlab } from '@gitbeaker/rest';
import { EncryptHelper } from '../../../common/utils';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import {
  GitLabProject,
  GitLabUser,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabPipeline,
  GitLabCommit,
  GitLabApiResponse,
  GitLabApiError,
} from '../interfaces/gitlab-api.interface';
import { GitBeakerTypeAdapter } from '../adapters/gitbeaker-type-adapter';

/**
 * GitLab API服务 - 使用 @gitbeaker/rest
 * 负责与GitLab实例进行API交互
 */
@Injectable()
export class GitLabApiGitBeakerService {
  private readonly logger = new Logger(GitLabApiGitBeakerService.name);
  private readonly defaultTimeout = 30000; // 30秒超时
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1秒重试延迟

  constructor(
    private readonly configService: ConfigService,
  ) {}


  /**
   * 获取解密后的API Token
   */
  private getDecryptedApiToken(instance: GitLabInstance): string {
    if (!instance.apiToken) {
      return '';
    }

    // 检查是否是AES加密的token（通常包含特殊字符，不是纯十六进制）
    if (instance.apiToken.includes('=') || instance.apiToken.includes('+') || instance.apiToken.includes('/')) {
      // 看起来是AES加密的token，尝试解密
      return EncryptHelper.decryptApiTokenWithConfig(instance.apiToken, this.configService);
    }
    
    // 检查是否是旧的SHA256哈希格式（64位十六进制字符串）
    if (instance.apiToken.match(/^[a-f0-9]{64}$/)) {
      this.logger.warn('检测到旧格式的API Token哈希，无法解密。请重新配置GitLab实例。');
      return instance.apiToken; // 返回原始值，但会失败
    }
    
    // 如果看起来是明文token，直接返回
    return instance.apiToken;
  }

  /**
   * 创建GitLab客户端实例
   */
  private createGitLabClient(instance: GitLabInstance): InstanceType<typeof Gitlab> {
    const decryptedToken = this.getDecryptedApiToken(instance);
    console.error('=--------instance apiUrl---------', instance.getApiUrl(), decryptedToken);
    return new Gitlab({
      host: instance.getApiUrl(),
      token: decryptedToken,
      
    //   timeout: this.defaultTimeout,
    //   retry: {
    //     retries: this.maxRetries,
    //     retryDelay: this.retryDelay,
    //   },
     // requestTimeout: this.defaultTimeout,
    });
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any, instance: GitLabInstance, operation: string): HttpException {
    this.logger.error(`GitLab API操作失败: ${operation}`, {
      instanceId: instance.id,
      instanceName: instance.name,
      error: error.message,
      stack: error.stack,
    });

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data.data?.message || error.message;
      
      switch (status) {
        case 401:
          return new HttpException(
            `GitLab认证失败: ${message}`,
            HttpStatus.UNAUTHORIZED,
          );
        case 403:
          return new HttpException(
            `GitLab权限不足: ${message}`,
            HttpStatus.FORBIDDEN,
          );
        case 404:
          return new HttpException(
            `GitLab资源不存在: ${message}`,
            HttpStatus.NOT_FOUND,
          );
        case 429:
          return new HttpException(
            `GitLab API限流: ${message}`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        default:
          return new HttpException(
            `GitLab API错误 (${status}): ${message}`,
            status,
          );
      }
    }

    return new HttpException(
      `GitLab连接失败: ${error.message}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * 测试GitLab实例连接
   */
  async testConnection(instance: GitLabInstance): Promise<boolean> {
    try {
      const api = this.createGitLabClient(instance);
      const user = await api.Users.show(0); // 0 表示当前用户
      return !!user;
    } catch (error: any) {
      this.logger.error(`GitLab连接测试失败: ${error.message}`, {
        instanceId: instance.id,
        instanceName: instance.name,
        error: error.stack,
      });
      return false;
    }
  }

  /**
   * 获取GitLab实例信息
   */
  async getInstanceInfo(instance: GitLabInstance): Promise<GitLabUser> {
    try {
      const api = this.createGitLabClient(instance);
      const user = await api.Users.show(0); // 0 表示当前用户
      return GitBeakerTypeAdapter.adaptUser(user);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getInstanceInfo');
    }
  }

  /**
   * 获取项目列表
   */
  async getProjects(
    instance: GitLabInstance,
    page: number = 1,
    perPage: number = 20,
    search?: string,
  ): Promise<{
    projects: GitLabProject[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const api = this.createGitLabClient(instance);
      const response = await api.Projects.all({
        pagination: 'offset',
        page,
        perPage,
        search,
        orderBy: 'last_activity_at',
        sort: 'desc',
        simple: false,
      });

      // GitBeaker返回的是项目数组，需要适配
      const projects = GitBeakerTypeAdapter.adaptProjects(response);
      
      // 由于GitBeaker可能不直接提供分页信息，我们使用当前页的项目数量作为估算
      // 这是一个简化的实现，实际项目中可能需要额外的API调用来获取总数
      const total = projects.length; // 当前页的项目数量
      const totalPages = Math.ceil(total / perPage);

      this.logger.debug(`获取GitLab项目列表: ${instance.id}`, {
        page,
        perPage,
        projectsCount: projects.length,
        total,
        totalPages,
      });

      return {
        projects,
        pagination: {
          page,
          perPage,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getProjects');
    }
  }

  /**
   * 获取特定项目信息
   */
  async getProject(instance: GitLabInstance, projectId: number): Promise<GitLabProject> {
    try {
      const api = this.createGitLabClient(instance);
      const project = await api.Projects.show(projectId);
      return GitBeakerTypeAdapter.adaptProject(project);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getProject');
    }
  }

  /**
   * 获取项目成员
   */
  async getProjectMembers(instance: GitLabInstance, projectId: number): Promise<GitLabUser[]> {
    try {
      const api = this.createGitLabClient(instance);
      const members = await api.ProjectMembers.all(projectId);
      return GitBeakerTypeAdapter.adaptUsers(members);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getProjectMembers');
    }
  }

  /**
   * 获取项目Issues
   */
  async getIssues(
    instance: GitLabInstance,
    projectId: number,
    page: number = 1,
    perPage: number = 20,
    state?: 'opened' | 'closed' | 'all',
  ): Promise<GitLabIssue[]> {
    try {
      const api = this.createGitLabClient(instance);
      const issues = await api.Issues.all({
        projectId,
        pagination: 'offset',
        page,
        perPage,
        state,
        orderBy: 'updated_at',
        sort: 'desc',
      });
      return GitBeakerTypeAdapter.adaptIssues(issues);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getIssues');
    }
  }

  /**
   * 获取特定Issue
   */
  async getIssue(instance: GitLabInstance, projectId: number, issueIid: number): Promise<GitLabIssue> {
    try {
      const api = this.createGitLabClient(instance);
      const issue = await (api.Issues as any).show(projectId, issueIid);
      return GitBeakerTypeAdapter.adaptIssue(issue);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getIssue');
    }
  }

  /**
   * 获取项目Merge Requests
   */
  async getMergeRequests(
    instance: GitLabInstance,
    projectId: number,
    page: number = 1,
    perPage: number = 20,
    state?: 'opened' | 'closed' | 'merged' | 'all',
  ): Promise<GitLabMergeRequest[]> {
    try {
      const api = this.createGitLabClient(instance);
      const mergeRequests = await api.MergeRequests.all({
        projectId,
        pagination: 'offset',
        page,
        perPage,
        state: state === 'all' ? undefined : state,
        orderBy: 'updated_at',
        sort: 'desc',
      });
      return GitBeakerTypeAdapter.adaptMergeRequests(mergeRequests);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getMergeRequests');
    }
  }

  /**
   * 获取特定Merge Request
   */
  async getMergeRequest(
    instance: GitLabInstance,
    projectId: number,
    mergeRequestIid: number,
  ): Promise<GitLabMergeRequest> {
    try {
      const api = this.createGitLabClient(instance);
      const mergeRequest = await api.MergeRequests.show(projectId, mergeRequestIid);
      return GitBeakerTypeAdapter.adaptMergeRequest(mergeRequest);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getMergeRequest');
    }
  }

  /**
   * 获取项目Pipelines
   */
  async getPipelines(
    instance: GitLabInstance,
    projectId: number,
    page: number = 1,
    perPage: number = 20,
    status?: string,
  ): Promise<GitLabPipeline[]> {
    try {
      const api = this.createGitLabClient(instance);
      const pipelines = await api.Pipelines.all(projectId, {
        pagination: 'offset',
        page,
        perPage,
        status: status as any,
        orderBy: 'updated_at',
        sort: 'desc',
      });
      return GitBeakerTypeAdapter.adaptPipelines(pipelines);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getPipelines');
    }
  }

  /**
   * 获取特定Pipeline
   */
  async getPipeline(instance: GitLabInstance, projectId: number, pipelineId: number): Promise<GitLabPipeline> {
    try {
      const api = this.createGitLabClient(instance);
      const pipeline = await api.Pipelines.show(projectId, pipelineId);
      return GitBeakerTypeAdapter.adaptPipeline(pipeline);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getPipeline');
    }
  }

  /**
   * 获取项目Commits
   */
  async getCommits(
    instance: GitLabInstance,
    projectId: number,
    ref?: string,
    since?: string,
    until?: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<GitLabCommit[]> {
    try {
      const api = this.createGitLabClient(instance);
      const commits = await api.Commits.all(projectId, {
        page,
        perPage,
        refName: ref,
        since,
        until,
      });
      return GitBeakerTypeAdapter.adaptCommits(commits);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getCommits');
    }
  }

  /**
   * 获取特定Commit
   */
  async getCommit(instance: GitLabInstance, projectId: number, sha: string): Promise<GitLabCommit> {
    try {
      const api = this.createGitLabClient(instance);
      const commit = await api.Commits.show(projectId, sha);
      return GitBeakerTypeAdapter.adaptCommit(commit);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getCommit');
    }
  }

  /**
   * 创建项目Webhook
   */
  async createProjectWebhook(
    instance: GitLabInstance,
    projectId: number,
    webhookUrl: string,
    secretToken?: string,
    events: string[] = ['push', 'merge_request', 'issue', 'pipeline'],
  ): Promise<{ id: number; url: string }> {
    try {
      const api = this.createGitLabClient(instance);
      const webhook = await api.ProjectHooks.add(projectId, webhookUrl, {
        token: secretToken,
        pushEvents: events.includes('push'),
        mergeRequestsEvents: events.includes('merge_request'),
        issuesEvents: events.includes('issue'),
        pipelineEvents: events.includes('pipeline'),
        enableSslVerification: true,
      });
      return { id: webhook.id, url: webhook.url };
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'createProjectWebhook');
    }
  }

  /**
   * 删除项目Webhook
   */
  async deleteProjectWebhook(instance: GitLabInstance, projectId: number, hookId: number): Promise<boolean> {
    try {
      const api = this.createGitLabClient(instance);
      await api.ProjectHooks.remove(projectId, hookId);
      return true;
    } catch (error: any) {
      this.logger.error(`删除GitLab Webhook失败: ${error.message}`, {
        instanceId: instance.id,
        projectId,
        hookId,
        error: error.stack,
      });
      return false;
    }
  }

  /**
   * 获取项目Webhooks
   */
  async getProjectWebhooks(instance: GitLabInstance, projectId: number): Promise<any[]> {
    try {
      const api = this.createGitLabClient(instance);
      const webhooks = await api.ProjectHooks.all(projectId);
      return webhooks;
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getProjectWebhooks');
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(
    instance: GitLabInstance,
    search: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<GitLabUser[]> {
    try {
      const api = this.createGitLabClient(instance);
      const users = await api.Users.all({
        search,
        page,
        perPage,
      });
      return GitBeakerTypeAdapter.adaptUsers(users);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'searchUsers');
    }
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(
    instance: GitLabInstance,
    page: number = 1,
    perPage: number = 100,
  ): Promise<GitLabUser[]> {
    try {

      
      const api = this.createGitLabClient(instance);

      const users = await api.Users.all({
        pagination: 'offset',
        page,
        perPage,
        orderBy: 'updated_at',
        sort: 'desc',
      });
      return GitBeakerTypeAdapter.adaptUsers(users);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getAllUsers');
    }
  }

  /**
   * 获取用户列表（简化版本）
   */
  async getUsers(instance: GitLabInstance): Promise<GitLabUser[]> {
    return this.getAllUsers(instance, 1, 100);
  }

  /**
   * 获取单个用户信息
   */
  async getUser(instance: GitLabInstance, userId: number): Promise<GitLabUser> {
    try {
      const api = this.createGitLabClient(instance);
      const user = await api.Users.show(userId);
      return GitBeakerTypeAdapter.adaptUser(user);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'getUser');
    }
  }

  /**
   * 创建Issue
   */
  async createIssue(
    instance: GitLabInstance,
    projectId: number,
    title: string,
    description?: string,
    assigneeIds?: number[],
    labels?: string[],
  ): Promise<GitLabIssue> {
    try {
      const api = this.createGitLabClient(instance);
      const issue = await api.Issues.create(projectId, title, {
        description,
        assigneeIds,
        labels: labels?.join(','),
      });
      return GitBeakerTypeAdapter.adaptIssue(issue);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'createIssue');
    }
  }

  /**
   * 更新Issue
   */
  async updateIssue(
    instance: GitLabInstance,
    projectId: number,
    issueIid: number,
    updates: {
      title?: string;
      description?: string;
      state?: 'opened' | 'closed';
      assigneeIds?: number[];
      labels?: string[];
    },
  ): Promise<GitLabIssue> {
    try {
      const api = this.createGitLabClient(instance);
      const issue = await api.Issues.edit(projectId, issueIid, {
        ...updates,
        labels: updates.labels?.join(','),
      });
      return GitBeakerTypeAdapter.adaptIssue(issue);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'updateIssue');
    }
  }

  /**
   * 创建Merge Request
   */
  async createMergeRequest(
    instance: GitLabInstance,
    projectId: number,
    title: string,
    sourceBranch: string,
    targetBranch: string,
    description?: string,
    assigneeIds?: number[],
    reviewerIds?: number[],
  ): Promise<GitLabMergeRequest> {
    try {
      const api = this.createGitLabClient(instance);
      const mergeRequest = await api.MergeRequests.create(projectId, sourceBranch, targetBranch, title, {
        description,
        assigneeIds,
        reviewerIds,
      });
      return GitBeakerTypeAdapter.adaptMergeRequest(mergeRequest);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'createMergeRequest');
    }
  }

  /**
   * 更新Merge Request
   */
  async updateMergeRequest(
    instance: GitLabInstance,
    projectId: number,
    mergeRequestIid: number,
    updates: {
      title?: string;
      description?: string;
      state?: 'opened' | 'closed' | 'merged';
      assigneeIds?: number[];
      reviewerIds?: number[];
      labels?: string[];
    },
  ): Promise<GitLabMergeRequest> {
    try {
      const api = this.createGitLabClient(instance);
      const mergeRequest = await api.MergeRequests.edit(projectId, mergeRequestIid, updates);
      return GitBeakerTypeAdapter.adaptMergeRequest(mergeRequest);
    } catch (error: any) {
      throw this.handleApiError(error, instance, 'updateMergeRequest');
    }
  }
}
