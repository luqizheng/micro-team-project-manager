/**
 * 同步相关类型定义
 * 定义同步功能中使用的类型
 */

import { SyncType, SyncStatus as SyncStatusEnum, SyncResult as SyncResultEnum, SyncPriority } from '../enums/sync.enum';

// Re-export enums for external use
export { SyncType, SyncStatus as SyncStatusEnum, SyncResult as SyncResultEnum, SyncPriority };

/**
 * 同步结果接口
 */
export interface SyncResult {
  /** 同步结果 */
  result: SyncResultEnum;
  /** 同步类型 */
  type: SyncType;
  /** 同步状�?*/ 
  status: SyncStatusEnum;
  /** 开始时�?*/
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 处理数量 */
  processedCount: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 跳过数量 */
  skippedCount: number;
  /** 错误信息 */
  errors?: string[];
  /** 统计信息 */
  statistics: SyncStatistics;
}

/**
 * 同步状态接�?
 */
export interface SyncStatus {
  /** 实例ID */
  instanceId: string;
  /** 同步类型 */
  type: SyncType;
  /** 同步状�?*/
  status: SyncStatusEnum;
  /** 进度百分�?*/
  progress: number;
  /** 当前步骤 */
  currentStep?: string;
  /** 总步骤数 */
  totalSteps: number;
  /** 当前步骤�?*/
  currentStepNumber: number;
  /** 开始时�?*/
  startTime: Date;
  /** 预计完成时间 */
  estimatedEndTime?: Date;
  /** 最后更新时�?*/
  lastUpdated: Date;
  /** 错误信息 */
  error?: string;
}

/**
 * 同步历史接口
 */
export interface SyncHistory {
  /** 历史ID */
  id: string;
  /** 实例ID */
  instanceId: string;
  /** 同步类型 */
  type: SyncType;
  /** 同步结果 */
  result: SyncResult;
  /** 开始时�?*/
  startTime: Date;
  /** 结束时间 */
  endTime: Date;
  /** 持续时间（毫秒） */
  duration: number;
  /** 处理数量 */
  processedCount: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 跳过数量 */
  skippedCount: number;
  /** 错误信息 */
  errors?: string[];
  /** 统计信息 */
  statistics: SyncStatistics;
}

/**
 * 同步统计信息接口
 */
export interface SyncStatistics {
  /** 总处理时间（毫秒�?*/
  totalTime: number;
  /** 平均处理时间（毫秒） */
  averageTime: number;
  /** 最快处理时间（毫秒�?*/
  fastestTime: number;
  /** 最慢处理时间（毫秒�?*/
  slowestTime: number;
  /** 成功�?*/
  successRate: number;
  /** 失败�?*/
  failureRate: number;
  /** 跳过�?*/
  skipRate: number;
  /** 吞吐量（每秒处理数量�?*/
  throughput: number;
  /** 内存使用量（字节�?*/
  memoryUsage: number;
  /** CPU使用�?*/
  cpuUsage: number;
}

/**
 * 同步配置接口
 */
export interface SyncTaskConfig {
  /** 是否启用自动同步 */
  autoSync: boolean;
  /** 同步间隔（分钟） */
  syncInterval: number;
  /** 批处理大�?*/
  batchSize: number;
  /** 并发�?*/
  concurrency: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 优先�?*/
  priority: SyncPriority;
  /** 是否启用增量同步 */
  enableIncremental: boolean;
  /** 是否启用全量同步 */
  enableFull: boolean;
  /** 是否启用用户同步 */
  enableUser: boolean;
}

/**
 * 同步任务接口
 */
export interface SyncTask {
  /** 任务ID */
  id: string;
  /** 实例ID */
  instanceId: string;
  /** 同步类型 */
  type: SyncType;
  /** 同步配置 */
  config: SyncTaskConfig;
  /** 创建时间 */
  createdAt: Date;
  /** 计划执行时间 */
  scheduledAt: Date;
  /** 开始时�?*/
  startedAt?: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 任务状�?*/
  status: SyncStatus;
  /** 任务结果 */
  result?: SyncResult;
  /** 错误信息 */
  error?: string;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次�?*/
  maxRetries: number;
}
