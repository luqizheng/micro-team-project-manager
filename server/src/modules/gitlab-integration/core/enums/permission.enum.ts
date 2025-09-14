/**
 * 权限相关枚举
 * 定义GitLab权限管理相关的枚举值
 */

/**
 * 权限类型枚举
 */
export enum PermissionType {
  /** 实例权限 */
  INSTANCE = 'instance',
  /** 项目权限 */
  PROJECT = 'project',
  /** 用户权限 */
  USER = 'user',
  /** 系统权限 */
  SYSTEM = 'system',
}

/**
 * 权限级别枚举
 */
export enum PermissionLevel {
  /** 只读权限 */
  READ = 'read',
  /** 写入权限 */
  WRITE = 'write',
  /** 管理权限 */
  ADMIN = 'admin',
  /** 所有者权限 */
  OWNER = 'owner',
}

/**
 * 权限状态枚举
 */
export enum PermissionStatus {
  /** 已授予 */
  GRANTED = 'granted',
  /** 已撤销 */
  REVOKED = 'revoked',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 待审核 */
  PENDING = 'pending',
}

/**
 * 权限范围枚举
 */
export enum PermissionScope {
  /** 全局范围 */
  GLOBAL = 'global',
  /** 实例范围 */
  INSTANCE = 'instance',
  /** 项目范围 */
  PROJECT = 'project',
  /** 用户范围 */
  USER = 'user',
}
