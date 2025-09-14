/**
 * 同步相关枚举
 * 定义同步功能中使用的枚举值
 */

/**
 * 同步类型枚举
 */
export enum SyncType {
  /** 增量同步 */
  INCREMENTAL = 'incremental',
  /** 全量同步 */
  FULL = 'full',
  /** 用户同步 */
  USER = 'user',
  /** 项目同步 */
  PROJECT = 'project',
  /** 问题同步 */
  ISSUE = 'issue',
  /** 合并请求同步 */
  MERGE_REQUEST = 'merge_request',
}

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  /** 未开始 */
  PENDING = 'pending',
  /** 进行中 */
  RUNNING = 'running',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已暂停 */
  PAUSED = 'paused',
}

/**
 * 同步结果枚举
 */
export enum SyncResult {
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAILURE = 'failure',
  /** 部分成功 */
  PARTIAL = 'partial',
  /** 跳过 */
  SKIPPED = 'skipped',
}

/**
 * 同步优先级枚举
 */
export enum SyncPriority {
  /** 低优先级 */
  LOW = 'low',
  /** 普通优先级 */
  NORMAL = 'normal',
  /** 高优先级 */
  HIGH = 'high',
  /** 紧急优先级 */
  URGENT = 'urgent',
}
