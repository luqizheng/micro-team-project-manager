/**
 * GitLab同步相关接口定义
 */

/**
 * 同步状态枚�?
 */
export enum SyncStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  IN_PROGRESS = 'in_progress',
}

/**
 * 同步结果接口
 */
export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  syncCount: number;
  lastSyncAt: Date;
}

/**
 * 同步配置接口
 */
export interface SyncConfig {
  maxRetries: number;
  retryInterval: number; // 毫秒
  batchSize: number;
  timeout: number; // 毫秒
  enableAutoSync: boolean;
  syncInterval: number; // 毫秒
}

/**
 * 事件处理结果接口
 */
export interface EventProcessResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  retryable: boolean;
}

/**
 * 数据映射配置接口
 */
export interface DataMappingConfig {
  issueMapping: {
    title: string;
    description: string;
    state: string;
    assignee: string;
    labels: string[];
    dueDate?: string;
  };
  userMapping: {
    name: string;
    email: string;
    username: string;
    avatar?: string;
  };
  projectMapping: {
    name: string;
    description: string;
    visibility: string;
  };
}

/**
 * 同步统计接口
 */
export interface SyncStatistics {
  totalMappings: number;
  activeMappings: number;
  successfulSyncs: number;
  failedSyncs: number;
  inProgressSyncs: number;
  lastSyncTime?: Date;
  averageSyncTime: number; // 毫秒
  errorRate: number; // 百分�?
}

/**
 * 同步日志接口
 */
export interface SyncLog {
  id: string;
  mappingId: string;
  timestamp: Date;
  status: SyncStatus;
  message: string;
  duration: number; // 毫秒
  error?: string;
  data?: any;
}

/**
 * 批量同步请求接口
 */
export interface BatchSyncRequest {
  mappingIds: string[];
  forceSync?: boolean;
  syncType?: 'full' | 'incremental';
}

/**
 * 批量同步响应接口
 */
export interface BatchSyncResponse {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
  errors: string[];
}

/**
 * 同步健康检查接�?
 */
export interface SyncHealthCheck {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  lastCheck: Date;
  nextCheck: Date;
}

/**
 * 事件过滤配置接口
 */
export interface EventFilterConfig {
  enabledEvents: string[];
  excludedProjects: number[];
  includedProjects: number[];
  userFilters: {
    includeUsers: number[];
    excludeUsers: number[];
  };
  labelFilters: {
    includeLabels: string[];
    excludeLabels: string[];
  };
}

/**
 * 同步监控指标接口
 */
export interface SyncMetrics {
  timestamp: Date;
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  queueSize: number;
  errorRate: number;
  throughput: number; // 事件/分钟
}
