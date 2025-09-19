/**
 * 配置相关类型定义
 * 定义配置功能中使用的类型
 */

/**
 * GitLab配置接口
 */
export interface GitLabConfig {
  /** API配置 */
  api: ApiConfig;
  /** 缓存配置 */
  cache: CacheConfig;
  /** 同步配置 */
  sync: SyncConfig;
  /** Webhook配置 */
  webhook: WebhookConfig;
  /** 日志配置 */
  logging: LoggingConfig;
  /** 监控配置 */
  monitoring: MonitoringConfig;
}

/**
 * API配置接口
 */
export interface ApiConfig {
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 最大重试次�?*/
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 请求间隔（毫秒） */
  requestInterval: number;
  /** 最大并发请求数 */
  maxConcurrency: number;
  /** 是否启用请求限流 */
  enableRateLimit: boolean;
  /** 限流配置 */
  rateLimit: RateLimitConfig;
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 默认生存时间（秒�?*/
  ttl: number;
  /** 最大缓存数�?*/
  maxSize: number;
  /** 缓存键前缀 */
  prefix: string;
  /** 是否启用压缩 */
  enableCompression: boolean;
  /** 压缩级别 */
  compressionLevel: number;
}

/**
 * 同步配置接口
 */
export interface SyncConfig {
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
  /** 是否启用增量同步 */
  enableIncremental: boolean;
  /** 是否启用全量同步 */
  enableFull: boolean;
  /** 是否启用用户同步 */
  enableUser: boolean;
  /** 同步间隔（分钟） */
  syncInterval: number;
}

/**
 * Webhook配置接口
 */
export interface WebhookConfig {
  /** Webhook密钥 */
  secret: string;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 最大重试次�?*/
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 是否启用签名验证 */
  enableSignatureVerification: boolean;
  /** 是否启用事件过滤 */
  enableEventFiltering: boolean;
  /** 允许的事件类�?*/
  allowedEventTypes: string[];
}

/**
 * 日志配置接口
 */
export interface LoggingConfig {
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** 是否启用文件日志 */
  enableFileLogging: boolean;
  /** 日志文件路径 */
  logFilePath: string;
  /** 日志文件最大大小（字节�?*/
  maxFileSize: number;
  /** 保留的日志文件数�?*/
  maxFiles: number;
  /** 是否启用控制台日�?*/
  enableConsoleLogging: boolean;
  /** 是否启用结构化日�?*/
  enableStructuredLogging: boolean;
}

/**
 * 监控配置接口
 */
export interface MonitoringConfig {
  /** 是否启用性能监控 */
  enablePerformanceMonitoring: boolean;
  /** 是否启用错误监控 */
  enableErrorMonitoring: boolean;
  /** 是否启用健康检�?*/
  enableHealthCheck: boolean;
  /** 健康检查间隔（秒） */
  healthCheckInterval: number;
  /** 是否启用指标收集 */
  enableMetricsCollection: boolean;
  /** 指标收集间隔（秒�?*/
  metricsCollectionInterval: number;
}

/**
 * 限流配置接口
 */
export interface RateLimitConfig {
  /** 每分钟最大请求数 */
  requestsPerMinute: number;
  /** 每小时最大请求数 */
  requestsPerHour: number;
  /** 每天最大请求数 */
  requestsPerDay: number;
  /** 是否启用突发限制 */
  enableBurstLimit: boolean;
  /** 突发限制大小 */
  burstLimit: number;
}

/**
 * 环境配置接口
 */
export interface EnvironmentConfig {
  /** 环境名称 */
  environment: 'development' | 'staging' | 'production';
  /** 是否启用调试模式 */
  debug: boolean;
  /** 是否启用开发模�?*/
  development: boolean;
  /** 是否启用生产模式 */
  production: boolean;
  /** 应用名称 */
  appName: string;
  /** 应用版本 */
  appVersion: string;
  /** 应用端口 */
  port: number;
  /** 应用主机 */
  host: string;
}
