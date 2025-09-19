/**
 * GitLab同步服务接口
 * 定义GitLab同步功能的核心业务接�?
 */

import { SyncResult, SyncStatus, SyncHistory } from '../types/sync.types';

/**
 * GitLab同步用例服务接口
 * 负责GitLab数据同步的业务逻辑
 */
export interface IGitLabSyncUseCase {
  /**
   * 执行增量同步
   * @param instanceId 实例ID
   * @returns 同步结果
   */
  executeIncrementalSync(instanceId: string): Promise<SyncResult>;

  /**
   * 执行全量同步
   * @param instanceId 实例ID
   * @returns 同步结果
   */
  executeFullSync(instanceId: string): Promise<SyncResult>;

  /**
   * 执行用户同步
   * @param instanceId 实例ID
   * @returns 同步结果
   */
  executeUserSync(instanceId: string): Promise<SyncResult>;

  /**
   * 获取同步状�?
   * @param instanceId 实例ID
   * @returns 同步状�?
   */
  getSyncStatus(instanceId: string): Promise<SyncStatus>;

  /**
   * 获取同步历史
   * @param instanceId 实例ID
   * @param limit 限制数量
   * @returns 同步历史列表
   */
  getSyncHistory(instanceId: string, limit?: number): Promise<SyncHistory[]>;

  /**
   * 停止同步
   * @param instanceId 实例ID
   */
  stopSync(instanceId: string): Promise<void>;

  /**
   * 重置同步状�?
   * @param instanceId 实例ID
   */
  resetSyncStatus(instanceId: string): Promise<void>;
}
