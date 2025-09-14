/**
 * 事件相关枚举
 * 定义GitLab事件相关的枚举值
 */

/**
 * 事件类型枚举
 */
export enum EventType {
  /** 问题事件 */
  ISSUE = 'issue',
  /** 合并请求事件 */
  MERGE_REQUEST = 'merge_request',
  /** 提交事件 */
  COMMIT = 'commit',
  /** 推送事件 */
  PUSH = 'push',
  /** 标签事件 */
  TAG = 'tag',
  /** 发布事件 */
  RELEASE = 'release',
  /** 用户事件 */
  USER = 'user',
  /** 项目事件 */
  PROJECT = 'project',
}

/**
 * 事件动作枚举
 */
export enum EventAction {
  /** 创建 */
  CREATED = 'created',
  /** 更新 */
  UPDATED = 'updated',
  /** 删除 */
  DELETED = 'deleted',
  /** 关闭 */
  CLOSED = 'closed',
  /** 重新打开 */
  REOPENED = 'reopened',
  /** 合并 */
  MERGED = 'merged',
  /** 推送 */
  PUSHED = 'pushed',
  /** 标签 */
  TAGGED = 'tagged',
  /** 发布 */
  RELEASED = 'released',
}

/**
 * 事件状态枚举
 */
export enum EventStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 已处理 */
  PROCESSED = 'processed',
  /** 处理失败 */
  FAILED = 'failed',
  /** 已跳过 */
  SKIPPED = 'skipped',
}

/**
 * 事件优先级枚举
 */
export enum EventPriority {
  /** 低优先级 */
  LOW = 'low',
  /** 普通优先级 */
  NORMAL = 'normal',
  /** 高优先级 */
  HIGH = 'high',
  /** 紧急优先级 */
  URGENT = 'urgent',
}
