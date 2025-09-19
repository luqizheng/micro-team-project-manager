/**
 * GitLab API客户端接口
 * 定义GitLab API交互的核心接�?
 */

import { GitLabInstance } from  '../entities/gitlab-instance.entity';

/**
 * GitLab API客户端接口
 * 负责与GitLab实例进行API交互
 */
export interface IGitLabApiClient {
  /**
   * 测试连接
   * @param instance 实例实体
   * @returns 连接是否成功
   */
  testConnection(instance: GitLabInstance): Promise<boolean>;

  /**
   * 获取实例信息
   * @param instance 实例实体
   * @returns 实例信息
   */
  getInstanceInfo(instance: GitLabInstance): Promise<GitLabInstanceInfo>;

  /**
   * 获取项目列表
   * @param instance 实例实体
   * @param options 查询选项
   * @returns 项目列表
   */
  getProjects(instance: GitLabInstance, options?: GetProjectsOptions): Promise<GitLabProject[]>;

  /**
   * 获取项目详情
   * @param instance 实例实体
   * @param projectId 项目ID
   * @returns 项目详情
   */
  getProject(instance: GitLabInstance, projectId: string): Promise<GitLabProject>;

  /**
   * 获取用户列表
   * @param instance 实例实体
   * @param options 查询选项
   * @returns 用户列表
   */
  getUsers(instance: GitLabInstance, options?: GetUsersOptions): Promise<GitLabUser[]>;

  /**
   * 获取用户详情
   * @param instance 实例实体
   * @param userId 用户ID
   * @returns 用户详情
   */
  getUser(instance: GitLabInstance, userId: string): Promise<GitLabUser>;

  /**
   * 获取问题列表
   * @param instance 实例实体
   * @param projectId 项目ID
   * @param options 查询选项
   * @returns 问题列表
   */
  getIssues(instance: GitLabInstance, projectId: string, options?: GetIssuesOptions): Promise<GitLabIssue[]>;

  /**
   * 获取问题详情
   * @param instance 实例实体
   * @param projectId 项目ID
   * @param issueId 问题ID
   * @returns 问题详情
   */
  getIssue(instance: GitLabInstance, projectId: string, issueId: string): Promise<GitLabIssue>;

  /**
   * 获取合并请求列表
   * @param instance 实例实体
   * @param projectId 项目ID
   * @param options 查询选项
   * @returns 合并请求列表
   */
  getMergeRequests(instance: GitLabInstance, projectId: string, options?: GetMergeRequestsOptions): Promise<GitLabMergeRequest[]>;

  /**
   * 获取合并请求详情
   * @param instance 实例实体
   * @param projectId 项目ID
   * @param mergeRequestId 合并请求ID
   * @returns 合并请求详情
   */
  getMergeRequest(instance: GitLabInstance, projectId: string, mergeRequestId: string): Promise<GitLabMergeRequest>;

  /**
   * 获取分组列表
   * @param instance 实例实体
   * @param options 查询选项
   * @returns 分组列表
   */
  getGroups(instance: GitLabInstance, options?: GetGroupsOptions): Promise<GitLabGroup[]>;

  /**
   * 获取分组详情
   * @param instance 实例实体
   * @param groupId 分组ID
   * @returns 分组详情
   */
  getGroup(instance: GitLabInstance, groupId: string): Promise<GitLabGroup>;
}

/**
 * GitLab实例信息接口
 */
export interface GitLabInstanceInfo {
  /** 实例版本 */
  version: string;
  /** 实例名称 */
  name: string;
  /** 实例URL */
  url: string;
  /** 实例类型 */
  type: 'self_hosted' | 'gitlab_com';
  /** 是否可用 */
  available: boolean;
  /** 最后检查时间 */
  lastChecked: Date;
}

/**
 * GitLab项目接口
 */
export interface GitLabProject {
  /** 项目ID */
  id: number;
  /** 项目名称 */
  name: string;
  /** 项目路径 */
  path: string;
  /** 项目描述 */
  description?: string;
  /** 项目URL */
  webUrl: string;
  /** 项目可见性 */
  visibility: 'private' | 'internal' | 'public';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 项目状态 */
  status: 'active' | 'archived' | 'deleted';
}

/**
 * GitLab用户接口
 */
export interface GitLabUser {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 姓名 */
  name: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 用户状态 */
  state: 'active' | 'blocked' | 'deactivated';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * GitLab问题接口
 */
export interface GitLabIssue {
  /** 问题ID */
  id: number;
  /** 项目ID */
  projectId: number;
  /** 问题标题 */
  title: string;
  /** 问题描述 */
  description?: string;
  /** 问题状态 */
  state: 'opened' | 'closed';
  /** 问题标签 */
  labels: string[];
  /** 创建者ID */
  authorId: number;
  /** 指派人ID */
  assigneeId?: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 关闭时间 */
  closedAt?: Date;
}

/**
 * GitLab合并请求接口
 */
export interface GitLabMergeRequest {
  /** 合并请求ID */
  id: number;
  /** 项目ID */
  projectId: number;
  /** 合并请求标题 */
  title: string;
  /** 合并请求描述 */
  description?: string;
  /** 合并请求状态 */
  state: 'opened' | 'closed' | 'merged';
  /** 源分支 */
  sourceBranch: string;
  /** 目标分支 */
  targetBranch: string;
  /** 创建者ID */
  authorId: number;
  /** 指派人ID */
  assigneeId?: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 合并时间 */
  mergedAt?: Date;
}

/**
 * 获取项目选项接口
 */
export interface GetProjectsOptions {
  /** 搜索关键字 */
  search?: string;
  /** 可见性 */
  visibility?: 'private' | 'internal' | 'public';
  /** 排序方式 */
  orderBy?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at';
  /** 排序方向 */
  sort?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
}

/**
 * 获取用户选项接口
 */
export interface GetUsersOptions {
  /** 搜索关键�?*/
  search?: string;
  /** 用户状�?*/
  state?: 'active' | 'blocked' | 'deactivated';
  /** 排序方式 */
  orderBy?: 'id' | 'name' | 'username' | 'created_at' | 'updated_at';
  /** 排序方向 */
  sort?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
}

/**
 * 获取问题选项接口
 */
export interface GetIssuesOptions {
  /** 问题状�?*/
  state?: 'opened' | 'closed' | 'all';
  /** 标签 */
  labels?: string[];
  /** 指派人ID */
  assigneeId?: number;
  /** 创建者ID */
  authorId?: number;
  /** 排序方式 */
  orderBy?: 'created_at' | 'updated_at' | 'priority' | 'due_date' | 'label_priority' | 'milestone_due_date';
  /** 排序方向 */
  sort?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
}

/**
 * 获取合并请求选项接口
 */
export interface GetMergeRequestsOptions {
  /** 合并请求状�?*/
  state?: 'opened' | 'closed' | 'merged' | 'all';
  /** 源分�?*/
  sourceBranch?: string;
  /** 目标分支 */
  targetBranch?: string;
  /** 指派人ID */
  assigneeId?: number;
  /** 创建者ID */
  authorId?: number;
  /** 排序方式 */
  orderBy?: 'created_at' | 'updated_at' | 'priority' | 'due_date' | 'label_priority' | 'milestone_due_date';
  /** 排序方向 */
  sort?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
}

/**
 * GitLab分组接口
 */
export interface GitLabGroup {
  /** 分组ID */
  id: number;
  /** 分组名称 */
  name: string;
  /** 分组路径 */
  path: string;
  /** 分组描述 */
  description?: string;
  /** 分组可见�?*/
  visibility: 'private' | 'internal' | 'public';
  /** 分组URL */
  webUrl: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 父分组ID */
  parentId?: number;
  /** 完整名称 */
  fullName: string;
  /** 完整路径 */
  fullPath: string;
  /** 头像URL */
  avatarUrl?: string;
  /** 是否启用LFS */
  lfsEnabled: boolean;
  /** 是否允许请求访问 */
  requestAccessEnabled: boolean;
  /** 项目数量 */
  projectsCount: number;
  /** 共享项目数量 */
  sharedProjectsCount: number;
  /** 运行器令�?*/
  runnersToken: string;
  /** 运行器令牌过期时�?*/
  runnersTokenExpiresAt?: string;
  /** 是否启用共享运行�?*/
  sharedRunnersEnabled: boolean;
  /** 共享的分�?*/
  sharedWithGroups: Array<{
    groupId: number;
    groupName: string;
    groupFullPath: string;
    groupAccessLevel: number;
    expiresAt?: string;
  }>;
  /** 统计信息 */
  statistics?: {
    storageSize: number;
    repositorySize: number;
    lfsObjectsSize: number;
    jobArtifactsSize: number;
  };
}

/**
 * 获取分组选项接口
 */
export interface GetGroupsOptions {
  /** 搜索关键�?*/
  search?: string;
  /** 可见�?*/
  visibility?: 'private' | 'internal' | 'public';
  /** 排序方式 */
  orderBy?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at';
  /** 排序方向 */
  sort?: 'asc' | 'desc';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  perPage?: number;
}
