import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
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

/**
 * GitLab API服务
 * 负责与GitLab实例进行API交互
 */
@Injectable()
export class GitLabApiService {
  private readonly logger = new Logger(GitLabApiService.name);
  private readonly defaultTimeout = 30000; // 30秒超时
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1秒重试延迟

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取API请求配置
   */
  private getApiConfig(instance: GitLabInstance, endpoint: string = ''): AxiosRequestConfig {
    const baseURL = instance.getApiUrl(endpoint);
    
    return {
      baseURL,
      timeout: this.defaultTimeout,
      headers: {
        'Authorization': `Bearer ${instance.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Project-Manager-GitLab-Integration/1.0',
      },
      validateStatus: (status) => status < 500, // 只对5xx错误抛出异常
    };
  }

  /**
   * 执行API请求（带重试机制）
   */
  private async executeRequest<T>(
    instance: GitLabInstance,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    retryCount: number = 0,
  ): Promise<GitLabApiResponse<T>> {
    try {
      const config = this.getApiConfig(instance, endpoint);
      const requestConfig: AxiosRequestConfig = {
        ...config,
        method,
        data,
      };

      this.logger.debug(`执行GitLab API请求: ${method} ${endpoint}`, {
        instanceId: instance.id,
        instanceName: instance.name,
        retryCount,
      });

      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.request<T>(requestConfig)
      );

      if (response.status >= 400) {
        throw new HttpException(
          `GitLab API错误: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      this.logger.error(`GitLab API请求失败: ${error.message}`, {
        instanceId: instance.id,
        instanceName: instance.name,
        endpoint,
        method,
        retryCount,
        error: error.stack,
      });

      // 如果是网络错误或5xx错误，且还有重试次数，则重试
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        this.logger.warn(`重试GitLab API请求 (${retryCount + 1}/${this.maxRetries})`, {
          instanceId: instance.id,
          endpoint,
          delay: this.retryDelay * (retryCount + 1),
        });

        await this.delay(this.retryDelay * (retryCount + 1));
        return this.executeRequest<T>(instance, endpoint, method, data, retryCount + 1);
      }

      throw this.handleApiError(error, instance, endpoint);
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any): boolean {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true; // 超时错误
    }
    if (error.response?.status >= 500) {
      return true; // 5xx服务器错误
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return true; // 网络连接错误
    }
    return false;
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any, instance: GitLabInstance, endpoint: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
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
      const response = await this.executeRequest<GitLabUser>(instance, '/user');
      return response.status === 200 && !!response.data;
    } catch (error) {
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
    const response = await this.executeRequest<GitLabUser>(instance, '/user');
    return response.data;
  }

  /**
   * 获取项目列表
   */
  async getProjects(
    instance: GitLabInstance,
    page: number = 1,
    perPage: number = 20,
    search?: string,
  ): Promise<GitLabProject[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      order_by: 'last_activity_at',
      sort: 'desc',
    });

    if (search) {
      params.append('search', search);
    }

    const response = await this.executeRequest<GitLabProject[]>(
      instance,
      `/projects?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取特定项目信息
   */
  async getProject(instance: GitLabInstance, projectId: number): Promise<GitLabProject> {
    const response = await this.executeRequest<GitLabProject>(
      instance,
      `/projects/${projectId}`
    );
    return response.data;
  }

  /**
   * 获取项目成员
   */
  async getProjectMembers(instance: GitLabInstance, projectId: number): Promise<GitLabUser[]> {
    const response = await this.executeRequest<GitLabUser[]>(
      instance,
      `/projects/${projectId}/members`
    );
    return response.data;
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
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      order_by: 'updated_at',
      sort: 'desc',
    });

    if (state) {
      params.append('state', state);
    }

    const response = await this.executeRequest<GitLabIssue[]>(
      instance,
      `/projects/${projectId}/issues?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取特定Issue
   */
  async getIssue(instance: GitLabInstance, projectId: number, issueIid: number): Promise<GitLabIssue> {
    const response = await this.executeRequest<GitLabIssue>(
      instance,
      `/projects/${projectId}/issues/${issueIid}`
    );
    return response.data;
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
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      order_by: 'updated_at',
      sort: 'desc',
    });

    if (state) {
      params.append('state', state);
    }

    const response = await this.executeRequest<GitLabMergeRequest[]>(
      instance,
      `/projects/${projectId}/merge_requests?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取特定Merge Request
   */
  async getMergeRequest(
    instance: GitLabInstance,
    projectId: number,
    mergeRequestIid: number,
  ): Promise<GitLabMergeRequest> {
    const response = await this.executeRequest<GitLabMergeRequest>(
      instance,
      `/projects/${projectId}/merge_requests/${mergeRequestIid}`
    );
    return response.data;
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
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      order_by: 'updated_at',
      sort: 'desc',
    });

    if (status) {
      params.append('status', status);
    }

    const response = await this.executeRequest<GitLabPipeline[]>(
      instance,
      `/projects/${projectId}/pipelines?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取特定Pipeline
   */
  async getPipeline(instance: GitLabInstance, projectId: number, pipelineId: number): Promise<GitLabPipeline> {
    const response = await this.executeRequest<GitLabPipeline>(
      instance,
      `/projects/${projectId}/pipelines/${pipelineId}`
    );
    return response.data;
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
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (ref) {
      params.append('ref_name', ref);
    }
    if (since) {
      params.append('since', since);
    }
    if (until) {
      params.append('until', until);
    }

    const response = await this.executeRequest<GitLabCommit[]>(
      instance,
      `/projects/${projectId}/repository/commits?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取特定Commit
   */
  async getCommit(instance: GitLabInstance, projectId: number, sha: string): Promise<GitLabCommit> {
    const response = await this.executeRequest<GitLabCommit>(
      instance,
      `/projects/${projectId}/repository/commits/${sha}`
    );
    return response.data;
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
    const data = {
      url: webhookUrl,
      token: secretToken,
      push_events: events.includes('push'),
      merge_requests_events: events.includes('merge_request'),
      issues_events: events.includes('issue'),
      pipeline_events: events.includes('pipeline'),
      enable_ssl_verification: true,
    };

    const response = await this.executeRequest<{ id: number; url: string }>(
      instance,
      `/projects/${projectId}/hooks`,
      'POST',
      data
    );
    return response.data;
  }

  /**
   * 删除项目Webhook
   */
  async deleteProjectWebhook(instance: GitLabInstance, projectId: number, hookId: number): Promise<boolean> {
    try {
      await this.executeRequest(
        instance,
        `/projects/${projectId}/hooks/${hookId}`,
        'DELETE'
      );
      return true;
    } catch (error) {
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
    const response = await this.executeRequest<any[]>(
      instance,
      `/projects/${projectId}/hooks`
    );
    return response.data;
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
    const params = new URLSearchParams({
      search: search,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await this.executeRequest<GitLabUser[]>(
      instance,
      `/users?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(
    instance: GitLabInstance,
    page: number = 1,
    perPage: number = 100,
  ): Promise<GitLabUser[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      order_by: 'last_activity_at',
      sort: 'desc',
    });

    const response = await this.executeRequest<GitLabUser[]>(
      instance,
      `/users?${params.toString()}`
    );
    return response.data;
  }
}
