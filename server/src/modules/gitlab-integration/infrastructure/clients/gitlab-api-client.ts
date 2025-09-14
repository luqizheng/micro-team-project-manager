/**
 * GitLab API客户端
 * 负责与GitLab实例进行API交互
 */

import { Injectable, Logger } from '@nestjs/common';
import { Gitlab } from '@gitbeaker/rest';
import { GitLabInstance } from '../../core/entities/gitlab-instance.entity';
import { IGitLabApiClient } from '../../core/interfaces/gitlab-api.interface';
import { GitLabConfigService } from '../config/gitlab-config.service';
import { GitLabCacheService } from '../cache/gitlab-cache.service';
import { GitLabCacheKeys } from '../cache/gitlab-cache-keys';
import { EncryptHelper } from '../../../../common/utils';
import {
  GitLabInstanceInfo,
  GitLabProject,
  GitLabUser,
  GitLabIssue,
  GitLabMergeRequest,
  GetProjectsOptions,
  GetUsersOptions,
  GetIssuesOptions,
  GetMergeRequestsOptions,
} from '../../core/interfaces/gitlab-api.interface';
import {
  GitLabApiException,
  GitLabApiConnectionFailedException,
  GitLabApiAuthenticationFailedException,
  GitLabApiRateLimitedException,
  GitLabApiTimeoutException,
  GitLabApiInvalidResponseException,
} from '../../shared/exceptions/gitlab-api.exception';

/**
 * GitLab API客户端实现
 * 提供与GitLab实例的API交互功能
 */
@Injectable()
export class GitLabApiClient implements IGitLabApiClient {
  private readonly logger = new Logger(GitLabApiClient.name);
  private readonly clientCache = new Map<string, any>();

  constructor(
    private readonly configService: GitLabConfigService,
    private readonly cacheService: GitLabCacheService,
  ) {}

  /**
   * 测试连接
   */
  async testConnection(instance: GitLabInstance): Promise<boolean> {
    try {
      const client = this.getClient(instance);
      await client.Users.current();
      this.logger.debug(`连接测试成功: ${instance.id}`);
      return true;
    } catch (error) {
      this.logger.error(`连接测试失败: ${instance.id}`, error);
      return false;
    }
  }

  /**
   * 获取实例信息
   */
  async getInstanceInfo(instance: GitLabInstance): Promise<GitLabInstanceInfo> {
    try {
      const client = this.getClient(instance);
      const version = await client.Version.show();
      const user = await client.Users.current();

      const info: GitLabInstanceInfo = {
        version: version.version || 'unknown',
        name: instance.name,
        url: instance.baseUrl,
        type: instance.instanceType,
        available: true,
        lastChecked: new Date(),
      };

      this.logger.debug(`获取实例信息成功: ${instance.id}`);
      return info;
    } catch (error: any) {
      this.logger.error(`获取实例信息失败: ${instance.id}`, error);
      throw new GitLabApiException(`获取实例信息失败: ${error.message}`, { instanceId: instance.id, error });
    }
  }

  /**
   * 获取项目列表
   */
  async getProjects(instance: GitLabInstance, options?: GetProjectsOptions): Promise<GitLabProject[]> {
    const cacheKey = GitLabCacheKeys.projects(instance.id);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabProject[]>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取项目列表: ${instance.id}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const projects = await client.Projects.all({
        search: options?.search,
        visibility: options?.visibility,
        order_by: options?.orderBy,
        sort: options?.sort,
        page: options?.page,
        per_page: options?.perPage || 20,
      });

      const gitlabProjects: GitLabProject[] = projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        path: project.path,
        description: project.description,
        webUrl: project.web_url,
        visibility: project.visibility as 'private' | 'internal' | 'public',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.last_activity_at),
        status: project.archived ? 'archived' : 'active',
      }));

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabProjects, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取项目列表成功: ${instance.id}, 数量: ${gitlabProjects.length}`);
      return gitlabProjects;
    } catch (error) {
      this.logger.error(`获取项目列表失败: ${instance.id}`, error);
      throw this.handleApiError(error, instance.id, 'getProjects');
    }
  }

  /**
   * 获取项目详情
   */
  async getProject(instance: GitLabInstance, projectId: string): Promise<GitLabProject> {
    const cacheKey = GitLabCacheKeys.project(instance.id, projectId);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabProject>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取项目详情: ${instance.id}:${projectId}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const project = await client.Projects.show(parseInt(projectId));

      const gitlabProject: GitLabProject = {
        id: project.id,
        name: project.name,
        path: project.path,
        description: project.description,
        webUrl: project.web_url,
        visibility: project.visibility as 'private' | 'internal' | 'public',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.last_activity_at),
        status: project.archived ? 'archived' : 'active',
      };

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabProject, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取项目详情成功: ${instance.id}:${projectId}`);
      return gitlabProject;
    } catch (error) {
      this.logger.error(`获取项目详情失败: ${instance.id}:${projectId}`, error);
      throw this.handleApiError(error, instance.id, 'getProject');
    }
  }

  /**
   * 获取用户列表
   */
  async getUsers(instance: GitLabInstance, options?: GetUsersOptions): Promise<GitLabUser[]> {
    const cacheKey = GitLabCacheKeys.users(instance.id);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabUser[]>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取用户列表: ${instance.id}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const users = await client.Users.all({
        search: options?.search,
        state: options?.state,
        order_by: options?.orderBy,
        sort: options?.sort,
        page: options?.page,
        per_page: options?.perPage || 20,
      });

      const gitlabUsers: GitLabUser[] = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        state: user.state as 'active' | 'blocked' | 'deactivated',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      }));

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabUsers, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取用户列表成功: ${instance.id}, 数量: ${gitlabUsers.length}`);
      return gitlabUsers;
    } catch (error) {
      this.logger.error(`获取用户列表失败: ${instance.id}`, error);
      throw this.handleApiError(error, instance.id, 'getUsers');
    }
  }

  /**
   * 获取用户详情
   */
  async getUser(instance: GitLabInstance, userId: string): Promise<GitLabUser> {
    const cacheKey = GitLabCacheKeys.user(instance.id, userId);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabUser>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取用户详情: ${instance.id}:${userId}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const user = await client.Users.show(parseInt(userId));

      const gitlabUser: GitLabUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        state: user.state as 'active' | 'blocked' | 'deactivated',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      };

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabUser, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取用户详情成功: ${instance.id}:${userId}`);
      return gitlabUser;
    } catch (error) {
      this.logger.error(`获取用户详情失败: ${instance.id}:${userId}`, error);
      throw this.handleApiError(error, instance.id, 'getUser');
    }
  }

  /**
   * 获取问题列表
   */
  async getIssues(instance: GitLabInstance, projectId: string, options?: GetIssuesOptions): Promise<GitLabIssue[]> {
    const cacheKey = GitLabCacheKeys.issues(instance.id, projectId);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabIssue[]>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取问题列表: ${instance.id}:${projectId}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const issues = await client.Issues.all({
        projectId: parseInt(projectId),
        state: options?.state,
        labels: options?.labels?.join(','),
        assignee_id: options?.assigneeId,
        author_id: options?.authorId,
        order_by: options?.orderBy,
        sort: options?.sort,
        page: options?.page,
        per_page: options?.perPage || 20,
      });

      const gitlabIssues: GitLabIssue[] = issues.map((issue: any) => ({
        id: issue.id,
        projectId: issue.project_id,
        title: issue.title,
        description: issue.description,
        state: issue.state as 'opened' | 'closed',
        labels: issue.labels || [],
        authorId: issue.author.id,
        assigneeId: issue.assignee?.id,
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
        closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
      }));

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabIssues, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取问题列表成功: ${instance.id}:${projectId}, 数量: ${gitlabIssues.length}`);
      return gitlabIssues;
    } catch (error) {
      this.logger.error(`获取问题列表失败: ${instance.id}:${projectId}`, error);
      throw this.handleApiError(error, instance.id, 'getIssues');
    }
  }

  /**
   * 获取问题详情
   */
  async getIssue(instance: GitLabInstance, projectId: string, issueId: string): Promise<GitLabIssue> {
    const cacheKey = GitLabCacheKeys.issue(instance.id, projectId, issueId);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabIssue>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取问题详情: ${instance.id}:${projectId}:${issueId}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const issue = await client.Issues.show(parseInt(projectId), parseInt(issueId));

      const gitlabIssue: GitLabIssue = {
        id: issue.id,
        projectId: issue.project_id,
        title: issue.title,
        description: issue.description,
        state: issue.state as 'opened' | 'closed',
        labels: issue.labels || [],
        authorId: issue.author.id,
        assigneeId: issue.assignee?.id,
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
        closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
      };

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabIssue, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取问题详情成功: ${instance.id}:${projectId}:${issueId}`);
      return gitlabIssue;
    } catch (error) {
      this.logger.error(`获取问题详情失败: ${instance.id}:${projectId}:${issueId}`, error);
      throw this.handleApiError(error, instance.id, 'getIssue');
    }
  }

  /**
   * 获取合并请求列表
   */
  async getMergeRequests(instance: GitLabInstance, projectId: string, options?: GetMergeRequestsOptions): Promise<GitLabMergeRequest[]> {
    const cacheKey = GitLabCacheKeys.mergeRequests(instance.id, projectId);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabMergeRequest[]>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取合并请求列表: ${instance.id}:${projectId}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const mergeRequests = await client.MergeRequests.all({
        projectId: parseInt(projectId),
        state: options?.state,
        source_branch: options?.sourceBranch,
        target_branch: options?.targetBranch,
        assignee_id: options?.assigneeId,
        author_id: options?.authorId,
        order_by: options?.orderBy,
        sort: options?.sort,
        page: options?.page,
        per_page: options?.perPage || 20,
      });

      const gitlabMergeRequests: GitLabMergeRequest[] = mergeRequests.map((mr: any) => ({
        id: mr.id,
        projectId: mr.project_id,
        title: mr.title,
        description: mr.description,
        state: mr.state as 'opened' | 'closed' | 'merged',
        sourceBranch: mr.source_branch,
        targetBranch: mr.target_branch,
        authorId: mr.author.id,
        assigneeId: mr.assignee?.id,
        createdAt: new Date(mr.created_at),
        updatedAt: new Date(mr.updated_at),
        mergedAt: mr.merged_at ? new Date(mr.merged_at) : undefined,
      }));

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabMergeRequests, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取合并请求列表成功: ${instance.id}:${projectId}, 数量: ${gitlabMergeRequests.length}`);
      return gitlabMergeRequests;
    } catch (error) {
      this.logger.error(`获取合并请求列表失败: ${instance.id}:${projectId}`, error);
      throw this.handleApiError(error, instance.id, 'getMergeRequests');
    }
  }

  /**
   * 获取合并请求详情
   */
  async getMergeRequest(instance: GitLabInstance, projectId: string, mergeRequestId: string): Promise<GitLabMergeRequest> {
    const cacheKey = GitLabCacheKeys.mergeRequest(instance.id, projectId, mergeRequestId);
    
    try {
      // 尝试从缓存获取
      if (this.configService.isCacheEnabled()) {
        const cached = await this.cacheService.get<GitLabMergeRequest>(cacheKey);
        if (cached) {
          this.logger.debug(`从缓存获取合并请求详情: ${instance.id}:${projectId}:${mergeRequestId}`);
          return cached;
        }
      }

      const client = this.getClient(instance);
      const mergeRequest = await client.MergeRequests.show(parseInt(projectId), parseInt(mergeRequestId));

      const gitlabMergeRequest: GitLabMergeRequest = {
        id: mergeRequest.id,
        projectId: mergeRequest.project_id,
        title: mergeRequest.title,
        description: mergeRequest.description,
        state: mergeRequest.state as 'opened' | 'closed' | 'merged',
        sourceBranch: mergeRequest.source_branch,
        targetBranch: mergeRequest.target_branch,
        authorId: mergeRequest.author.id,
        assigneeId: mergeRequest.assignee?.id,
        createdAt: new Date(mergeRequest.created_at),
        updatedAt: new Date(mergeRequest.updated_at),
        mergedAt: mergeRequest.merged_at ? new Date(mergeRequest.merged_at) : undefined,
      };

      // 缓存结果
      if (this.configService.isCacheEnabled()) {
        await this.cacheService.set(cacheKey, gitlabMergeRequest, this.configService.getCacheTtl());
      }

      this.logger.debug(`获取合并请求详情成功: ${instance.id}:${projectId}:${mergeRequestId}`);
      return gitlabMergeRequest;
    } catch (error) {
      this.logger.error(`获取合并请求详情失败: ${instance.id}:${projectId}:${mergeRequestId}`, error);
      throw this.handleApiError(error, instance.id, 'getMergeRequest');
    }
  }

  /**
   * 获取GitLab客户端
   */
  private getClient(instance: GitLabInstance): any {
    const cacheKey = `client:${instance.id}`;
    
    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey)!;
    }

    const apiToken = this.getDecryptedApiToken(instance);
    const client = new Gitlab({
      host: instance.baseUrl,
      token: apiToken,
    });

    this.clientCache.set(cacheKey, client);
    return client;
  }

  /**
   * 获取解密后的API Token
   */
  private getDecryptedApiToken(instance: GitLabInstance): string {
    if (!instance.apiToken) {
      throw new GitLabApiAuthenticationFailedException(instance.id);
    }

    try {
      // 检查是否是AES加密的token
      if (instance.apiToken.includes('=') || instance.apiToken.includes('+') || instance.apiToken.includes('/')) {
        return EncryptHelper.decryptApiTokenWithConfig(instance.apiToken, this.configService as any);
      }
      
      // 检查是否是旧的SHA256哈希格式
      if (instance.apiToken.match(/^[a-f0-9]{64}$/)) {
        this.logger.warn('检测到旧格式的API Token哈希，无法解密。请重新配置GitLab实例。');
        throw new GitLabApiAuthenticationFailedException(instance.id);
      }
      
      // 假设是明文token
      return instance.apiToken;
    } catch (error) {
      this.logger.error(`解密API Token失败: ${instance.id}`, error);
      throw new GitLabApiAuthenticationFailedException(instance.id);
    }
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any, instanceId: string, operation: string): GitLabApiException {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new GitLabApiConnectionFailedException(instanceId, error.message);
    }
    
    if (error.status === 401) {
      throw new GitLabApiAuthenticationFailedException(instanceId);
    }
    
    if (error.status === 429) {
      throw new GitLabApiRateLimitedException(instanceId, error.headers?.['retry-after']);
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new GitLabApiTimeoutException(instanceId, this.configService.getApiTimeout());
    }
    
    if (error.status >= 400 && error.status < 500) {
      throw new GitLabApiInvalidResponseException(instanceId, error.message);
    }
    
    return new GitLabApiException(`操作失败: ${operation}`, {
      instanceId,
      operation,
      error: error.message,
      status: error.status,
    });
  }

  /**
   * 清理客户端缓存
   */
  clearClientCache(): void {
    this.clientCache.clear();
    this.logger.debug('清理客户端缓存');
  }

  /**
   * 清理特定实例的客户端缓存
   */
  clearInstanceClientCache(instanceId: string): void {
    const cacheKey = `client:${instanceId}`;
    this.clientCache.delete(cacheKey);
    this.logger.debug(`清理实例客户端缓存: ${instanceId}`);
  }
}
