/**
 * GitLab缓存键管理
 * 负责生成和管理GitLab集成功能的缓存键
 */

/**
 * GitLab缓存键管理类
 * 提供统一的缓存键生成和管理
 */
export class GitLabCacheKeys {
  /** 缓存键前缀 */
  private static readonly PREFIX = 'gitlab:';

  /**
   * 实例缓存键
   */
  static instance(id: string): string {
    return `${this.PREFIX}instance:${id}`;
  }

  /**
   * 实例列表缓存键
   */
  static instances(): string {
    return `${this.PREFIX}instances:list`;
  }

  /**
   * 项目缓存键
   */
  static projects(instanceId: string): string {
    return `${this.PREFIX}projects:${instanceId}`;
  }

  /**
   * 项目详情缓存键
   */
  static project(instanceId: string, projectId: string): string {
    return `${this.PREFIX}project:${instanceId}:${projectId}`;
  }

  /**
   * 用户缓存键
   */
  static users(instanceId: string): string {
    return `${this.PREFIX}users:${instanceId}`;
  }

  /**
   * 用户详情缓存键
   */
  static user(instanceId: string, userId: string): string {
    return `${this.PREFIX}user:${instanceId}:${userId}`;
  }

  /**
   * 问题缓存键
   */
  static issues(instanceId: string, projectId: string): string {
    return `${this.PREFIX}issues:${instanceId}:${projectId}`;
  }

  /**
   * 问题详情缓存键
   */
  static issue(instanceId: string, projectId: string, issueId: string): string {
    return `${this.PREFIX}issue:${instanceId}:${projectId}:${issueId}`;
  }

  /**
   * 合并请求缓存键
   */
  static mergeRequests(instanceId: string, projectId: string): string {
    return `${this.PREFIX}merge_requests:${instanceId}:${projectId}`;
  }

  /**
   * 合并请求详情缓存键
   */
  static mergeRequest(instanceId: string, projectId: string, mergeRequestId: string): string {
    return `${this.PREFIX}merge_request:${instanceId}:${projectId}:${mergeRequestId}`;
  }

  /**
   * 同步状态缓存键
   */
  static syncStatus(instanceId: string): string {
    return `${this.PREFIX}sync:status:${instanceId}`;
  }

  /**
   * 同步历史缓存键
   */
  static syncHistory(instanceId: string): string {
    return `${this.PREFIX}sync:history:${instanceId}`;
  }

  /**
   * 项目映射缓存键
   */
  static projectMappings(instanceId: string): string {
    return `${this.PREFIX}project_mappings:${instanceId}`;
  }

  /**
   * 项目映射详情缓存键
   */
  static projectMapping(id: string): string {
    return `${this.PREFIX}project_mapping:${id}`;
  }

  /**
   * 用户映射缓存键
   */
  static userMappings(instanceId: string): string {
    return `${this.PREFIX}user_mappings:${instanceId}`;
  }

  /**
   * 用户映射详情缓存键
   */
  static userMapping(id: string): string {
    return `${this.PREFIX}user_mapping:${id}`;
  }

  /**
   * 事件日志缓存键
   */
  static eventLogs(instanceId: string): string {
    return `${this.PREFIX}event_logs:${instanceId}`;
  }

  /**
   * 事件日志详情缓存键
   */
  static eventLog(id: string): string {
    return `${this.PREFIX}event_log:${id}`;
  }

  /**
   * 权限缓存键
   */
  static permissions(userId: string): string {
    return `${this.PREFIX}permissions:${userId}`;
  }

  /**
   * 实例权限缓存键
   */
  static instancePermissions(instanceId: string): string {
    return `${this.PREFIX}instance_permissions:${instanceId}`;
  }

  /**
   * 项目权限缓存键
   */
  static projectPermissions(projectId: string): string {
    return `${this.PREFIX}project_permissions:${projectId}`;
  }

  /**
   * API响应缓存键
   */
  static apiResponse(instanceId: string, endpoint: string, params?: string): string {
    const paramStr = params ? `:${params}` : '';
    return `${this.PREFIX}api:${instanceId}:${endpoint}${paramStr}`;
  }

  /**
   * 配置缓存键
   */
  static config(key: string): string {
    return `${this.PREFIX}config:${key}`;
  }

  /**
   * 统计信息缓存键
   */
  static statistics(instanceId: string): string {
    return `${this.PREFIX}statistics:${instanceId}`;
  }

  /**
   * 健康检查缓存键
   */
  static healthCheck(instanceId: string): string {
    return `${this.PREFIX}health_check:${instanceId}`;
  }

  /**
   * 生成带参数的缓存键
   */
  static withParams(baseKey: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${baseKey}:${sortedParams}`;
  }

  /**
   * 生成带时间戳的缓存键
   */
  static withTimestamp(baseKey: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    return `${baseKey}:${ts}`;
  }

  /**
   * 生成带版本的缓存键
   */
  static withVersion(baseKey: string, version: string): string {
    return `${baseKey}:v${version}`;
  }

  /**
   * 验证缓存键格式
   */
  static isValid(key: string): boolean {
    return key.startsWith(this.PREFIX) && key.length > this.PREFIX.length;
  }

  /**
   * 提取缓存键的原始部分
   */
  static extractOriginal(key: string): string {
    if (key.startsWith(this.PREFIX)) {
      return key.substring(this.PREFIX.length);
    }
    return key;
  }

  /**
   * 获取缓存键类型
   */
  static getType(key: string): string | null {
    if (!key.startsWith(this.PREFIX)) {
      return null;
    }
    
    const withoutPrefix = key.substring(this.PREFIX.length);
    const parts = withoutPrefix.split(':');
    
    if (parts.length > 0) {
      return parts[0];
    }
    
    return null;
  }

  /**
   * 获取所有实例相关的缓存键模式
   */
  static getInstancePattern(instanceId: string): string {
    return `${this.PREFIX}*:${instanceId}*`;
  }

  /**
   * 获取所有项目相关的缓存键模式
   */
  static getProjectPattern(instanceId: string, projectId: string): string {
    return `${this.PREFIX}*:${instanceId}:${projectId}*`;
  }

  /**
   * 获取所有用户相关的缓存键模式
   */
  static getUserPattern(instanceId: string, userId: string): string {
    return `${this.PREFIX}*:${instanceId}:${userId}*`;
  }
}
