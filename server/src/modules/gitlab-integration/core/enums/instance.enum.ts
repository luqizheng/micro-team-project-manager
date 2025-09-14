/**
 * 实例相关枚举
 * 定义GitLab实例相关的枚举值
 */

/**
 * 实例类型枚举
 */
export enum InstanceType {
  /** 自托管实例 */
  SELF_HOSTED = 'self_hosted',
  /** GitLab.com */
  GITLAB_COM = 'gitlab_com',
}

/**
 * 实例状态枚举
 */
export enum InstanceStatus {
  /** 活跃 */
  ACTIVE = 'active',
  /** 非活跃 */
  INACTIVE = 'inactive',
  /** 维护中 */
  MAINTENANCE = 'maintenance',
  /** 错误 */
  ERROR = 'error',
}

/**
 * 实例健康状态枚举
 */
export enum InstanceHealthStatus {
  /** 健康 */
  HEALTHY = 'healthy',
  /** 警告 */
  WARNING = 'warning',
  /** 错误 */
  ERROR = 'error',
  /** 未知 */
  UNKNOWN = 'unknown',
}

/**
 * 实例配置状态枚举
 */
export enum InstanceConfigStatus {
  /** 未配置 */
  NOT_CONFIGURED = 'not_configured',
  /** 配置中 */
  CONFIGURING = 'configuring',
  /** 已配置 */
  CONFIGURED = 'configured',
  /** 配置错误 */
  CONFIG_ERROR = 'config_error',
}
