/**
 * GitLab数据访问接口
 * 定义GitLab数据访问层的核心接口
 */

import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabGroupMapping } from '../entities/gitlab-group-mapping.entity';
import { GitLabUserMapping } from '../entities/gitlab-user-mapping.entity';
import { GitLabEventLog } from '../entities/gitlab-event-log.entity';

/**
 * GitLab实例仓储接口
 * 负责GitLab实例的数据访�?
 */
export interface IGitLabInstanceRepository {
  /**
   * 根据ID查找实例
   * @param id 实例ID
   * @returns 实例实体或null
   */
  findById(id: string): Promise<GitLabInstance | null>;

  /**
   * 查找所有实�?
   * @returns 实例实体列表
   */
  findAll(): Promise<GitLabInstance[]>;

  /**
   * 根据基础URL查找实例
   * @param baseUrl 基础URL
   * @returns 实例实体或null
   */
  findByBaseUrl(baseUrl: string): Promise<GitLabInstance | null>;

  /**
   * 保存实例
   * @param instance 实例实体
   * @returns 保存后的实例实体
   */
  save(instance: GitLabInstance): Promise<GitLabInstance>;

  /**
   * 更新实例
   * @param id 实例ID
   * @param instance 部分实例实体
   * @returns 更新后的实例实体
   */
  update(id: string, instance: Partial<GitLabInstance>): Promise<GitLabInstance>;

  /**
   * 删除实例
   * @param id 实例ID
   */
  delete(id: string): Promise<void>;

  /**
   * 检查实例是否存�?
   * @param id 实例ID
   * @returns 是否存在
   */
  exists(id: string): Promise<boolean>;
}

/**
 * GitLab分组映射仓储接口
 * 负责GitLab分组映射的数据访�?
 */
export interface IGitLabGroupMappingRepository {
  /**
   * 根据ID查找分组映射
   * @param id 映射ID
   * @returns 分组映射实体或null
   */
  findById(id: string): Promise<GitLabGroupMapping | null>;

  /**
   * 根据实例ID查找分组映射
   * @param instanceId 实例ID
   * @returns 分组映射实体列表
   */
  findByInstanceId(instanceId: string): Promise<GitLabGroupMapping[]>;

  /**
   * 根据项目ID查找分组映射
   * @param projectId 项目ID
   * @returns 分组映射实体或null
   */
  findByProjectId(projectId: string): Promise<GitLabGroupMapping | null>;

  /**
   * 查找所有分组映�?
   * @returns 分组映射实体列表
   */
  findAll(): Promise<GitLabGroupMapping[]>;

  /**
   * 保存分组映射
   * @param mapping 分组映射实体
   * @returns 保存后的分组映射实体
   */
  save(mapping: GitLabGroupMapping): Promise<GitLabGroupMapping>;

  /**
   * 更新分组映射
   * @param id 映射ID
   * @param mapping 部分分组映射实体
   * @returns 更新后的分组映射实体
   */
  update(id: string, mapping: Partial<GitLabGroupMapping>): Promise<GitLabGroupMapping>;

  /**
   * 删除分组映射
   * @param id 映射ID
   */
  delete(id: string): Promise<void>;

  /**
   * 检查分组映射是否存�?
   * @param id 映射ID
   * @returns 是否存在
   */
  exists(id: string): Promise<boolean>;
}

/**
 * GitLab用户映射仓储接口
 * 负责GitLab用户映射的数据访�?
 */
export interface IGitLabUserMappingRepository {
  /**
   * 根据ID查找用户映射
   * @param id 映射ID
   * @returns 用户映射实体或null
   */
  findById(id: string): Promise<GitLabUserMapping | null>;

  /**
   * 根据实例ID查找用户映射
   * @param instanceId 实例ID
   * @returns 用户映射实体列表
   */
  findByInstanceId(instanceId: string): Promise<GitLabUserMapping[]>;

  /**
   * 根据用户ID查找用户映射
   * @param userId 用户ID
   * @returns 用户映射实体或null
   */
  findByUserId(userId: string): Promise<GitLabUserMapping | null>;

  /**
   * 保存用户映射
   * @param mapping 用户映射实体
   * @returns 保存后的用户映射实体
   */
  save(mapping: GitLabUserMapping): Promise<GitLabUserMapping>;

  /**
   * 更新用户映射
   * @param id 映射ID
   * @param mapping 部分用户映射实体
   * @returns 更新后的用户映射实体
   */
  update(id: string, mapping: Partial<GitLabUserMapping>): Promise<GitLabUserMapping>;

  /**
   * 删除用户映射
   * @param id 映射ID
   */
  delete(id: string): Promise<void>;
}

/**
 * GitLab事件日志仓储接口
 * 负责GitLab事件日志的数据访�?
 */
export interface IGitLabEventLogRepository {
  /**
   * 根据ID查找事件日志
   * @param id 日志ID
   * @returns 事件日志实体或null
   */
  findById(id: string): Promise<GitLabEventLog | null>;

  /**
   * 根据实例ID查找事件日志
   * @param instanceId 实例ID
   * @param limit 限制数量
   * @returns 事件日志实体列表
   */
  findByInstanceId(instanceId: string, limit?: number): Promise<GitLabEventLog[]>;

  /**
   * 保存事件日志
   * @param eventLog 事件日志实体
   * @returns 保存后的事件日志实体
   */
  save(eventLog: GitLabEventLog): Promise<GitLabEventLog>;

  /**
   * 批量保存事件日志
   * @param eventLogs 事件日志实体列表
   * @returns 保存后的事件日志实体列表
   */
  saveMany(eventLogs: GitLabEventLog[]): Promise<GitLabEventLog[]>;

  /**
   * 删除过期的事件日�?
   * @param days 保留天数
   */
  deleteExpired(days: number): Promise<void>;
}
