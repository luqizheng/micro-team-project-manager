/**
 * GitLab配置服务
 * 负责GitLab集成功能的配置管�?
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitLabConfig, ApiConfig, CacheConfig, SyncConfig, WebhookConfig, LoggingConfig, MonitoringConfig } from '../../core/types/config.types';

/**
 * GitLab配置服务
 * 提供GitLab集成功能的配置管�?
 */
@Injectable()
export class GitLabConfigService {
  private readonly logger = new Logger(GitLabConfigService.name);
  private readonly config: GitLabConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * 获取完整配置
   */
  getConfig(): GitLabConfig {
    return this.config;
  }

  /**
   * 获取API配置
   */
  getApiConfig(): ApiConfig {
    return this.config.api;
  }

  /**
   * 获取缓存配置
   */
  getCacheConfig(): CacheConfig {
    return this.config.cache;
  }

  /**
   * 获取同步配置
   */
  getSyncConfig(): SyncConfig {
    return this.config.sync;
  }

  /**
   * 获取Webhook配置
   */
  getWebhookConfig(): WebhookConfig {
    return this.config.webhook;
  }

  /**
   * 获取日志配置
   */
  getLoggingConfig(): LoggingConfig {
    return this.config.logging;
  }

  /**
   * 获取监控配置
   */
  getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  /**
   * 获取API超时时间
   */
  getApiTimeout(): number {
    return this.config.api.timeout;
  }

  /**
   * 获取最大重试次�?
   */
  getMaxRetries(): number {
    return this.config.api.maxRetries;
  }

  /**
   * 获取重试延迟
   */
  getRetryDelay(): number {
    return this.config.api.retryDelay;
  }

  /**
   * 获取批处理大�?
   */
  getBatchSize(): number {
    return this.config.sync.batchSize;
  }

  /**
   * 获取并发�?
   */
  getConcurrency(): number {
    return this.config.sync.concurrency;
  }

  /**
   * 获取同步超时时间
   */
  getSyncTimeout(): number {
    return this.config.sync.timeout;
  }

  /**
   * 获取缓存TTL
   */
  getCacheTtl(): number {
    return this.config.cache.ttl;
  }

  /**
   * 是否启用缓存
   */
  isCacheEnabled(): boolean {
    return this.config.cache.enabled;
  }

  /**
   * 是否启用增量同步
   */
  isIncrementalSyncEnabled(): boolean {
    return this.config.sync.enableIncremental;
  }

  /**
   * 是否启用全量同步
   */
  isFullSyncEnabled(): boolean {
    return this.config.sync.enableFull;
  }

  /**
   * 是否启用用户同步
   */
  isUserSyncEnabled(): boolean {
    return this.config.sync.enableUser;
  }

  /**
   * 加载配置
   */
  private loadConfig(): GitLabConfig {
    return {
      api: this.loadApiConfig(),
      cache: this.loadCacheConfig(),
      sync: this.loadSyncConfig(),
      webhook: this.loadWebhookConfig(),
      logging: this.loadLoggingConfig(),
      monitoring: this.loadMonitoringConfig(),
    };
  }

  /**
   * 加载API配置
   */
  private loadApiConfig(): ApiConfig {
    return {
      timeout: this.configService.get<number>('GITLAB_API_TIMEOUT', 30000),
      maxRetries: this.configService.get<number>('GITLAB_API_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>('GITLAB_API_RETRY_DELAY', 1000),
      requestInterval: this.configService.get<number>('GITLAB_API_REQUEST_INTERVAL', 100),
      maxConcurrency: this.configService.get<number>('GITLAB_API_MAX_CONCURRENCY', 10),
      enableRateLimit: this.configService.get<boolean>('GITLAB_API_ENABLE_RATE_LIMIT', true),
      rateLimit: {
        requestsPerMinute: this.configService.get<number>('GITLAB_API_RATE_LIMIT_PER_MINUTE', 60),
        requestsPerHour: this.configService.get<number>('GITLAB_API_RATE_LIMIT_PER_HOUR', 1000),
        requestsPerDay: this.configService.get<number>('GITLAB_API_RATE_LIMIT_PER_DAY', 10000),
        enableBurstLimit: this.configService.get<boolean>('GITLAB_API_ENABLE_BURST_LIMIT', true),
        burstLimit: this.configService.get<number>('GITLAB_API_BURST_LIMIT', 10),
      },
    };
  }

  /**
   * 加载缓存配置
   */
  private loadCacheConfig(): CacheConfig {
    return {
      enabled: this.configService.get<boolean>('GITLAB_CACHE_ENABLED', true),
      ttl: this.configService.get<number>('GITLAB_CACHE_TTL', 3600),
      maxSize: this.configService.get<number>('GITLAB_CACHE_MAX_SIZE', 1000),
      prefix: this.configService.get<string>('GITLAB_CACHE_PREFIX', 'gitlab:'),
      enableCompression: this.configService.get<boolean>('GITLAB_CACHE_ENABLE_COMPRESSION', false),
      compressionLevel: this.configService.get<number>('GITLAB_CACHE_COMPRESSION_LEVEL', 6),
    };
  }

  /**
   * 加载同步配置
   */
  private loadSyncConfig(): SyncConfig {
    return {
      batchSize: this.configService.get<number>('GITLAB_SYNC_BATCH_SIZE', 100),
      concurrency: this.configService.get<number>('GITLAB_SYNC_CONCURRENCY', 5),
      timeout: this.configService.get<number>('GITLAB_SYNC_TIMEOUT', 300000),
      retryCount: this.configService.get<number>('GITLAB_SYNC_RETRY_COUNT', 3),
      retryDelay: this.configService.get<number>('GITLAB_SYNC_RETRY_DELAY', 5000),
      enableIncremental: this.configService.get<boolean>('GITLAB_SYNC_ENABLE_INCREMENTS', true),
      enableFull: this.configService.get<boolean>('GITLAB_SYNC_ENABLE_FULL', true),
      enableUser: this.configService.get<boolean>('GITLAB_SYNC_ENABLE_USER', true),
      syncInterval: this.configService.get<number>('GITLAB_SYNC_INTERVAL', 60),
    };
  }

  /**
   * 加载Webhook配置
   */
  private loadWebhookConfig(): WebhookConfig {
    return {
      secret: this.configService.get<string>('GITLAB_WEBHOOK_SECRET', ''),
      timeout: this.configService.get<number>('GITLAB_WEBHOOK_TIMEOUT', 30000),
      maxRetries: this.configService.get<number>('GITLAB_WEBHOOK_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>('GITLAB_WEBHOOK_RETRY_DELAY', 1000),
      enableSignatureVerification: this.configService.get<boolean>('GITLAB_WEBHOOK_ENABLE_SIGNATURE_VERIFICATION', true),
      enableEventFiltering: this.configService.get<boolean>('GITLAB_WEBHOOK_ENABLE_EVENT_FILTERING', true),
      allowedEventTypes: this.configService.get<string[]>('GITLAB_WEBHOOK_ALLOWED_EVENT_TYPES', [
        'issue',
        'merge_request',
        'push',
        'tag_push',
        'release',
      ]),
    };
  }

  /**
   * 加载日志配置
   */
  private loadLoggingConfig(): LoggingConfig {
    return {
      level: this.configService.get<'debug' | 'info' | 'warn' | 'error'>('GITLAB_LOG_LEVEL', 'info'),
      enableFileLogging: this.configService.get<boolean>('GITLAB_LOG_ENABLE_FILE', false),
      logFilePath: this.configService.get<string>('GITLAB_LOG_FILE_PATH', './logs/gitlab-integration.log'),
      maxFileSize: this.configService.get<number>('GITLAB_LOG_MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
      maxFiles: this.configService.get<number>('GITLAB_LOG_MAX_FILES', 5),
      enableConsoleLogging: this.configService.get<boolean>('GITLAB_LOG_ENABLE_CONSOLE', true),
      enableStructuredLogging: this.configService.get<boolean>('GITLAB_LOG_ENABLE_STRUCTURED', true),
    };
  }

  /**
   * 加载监控配置
   */
  private loadMonitoringConfig(): MonitoringConfig {
    return {
      enablePerformanceMonitoring: this.configService.get<boolean>('GITLAB_MONITORING_ENABLE_PERFORMANCE', true),
      enableErrorMonitoring: this.configService.get<boolean>('GITLAB_MONITORING_ENABLE_ERROR', true),
      enableHealthCheck: this.configService.get<boolean>('GITLAB_MONITORING_ENABLE_HEALTH_CHECK', true),
      healthCheckInterval: this.configService.get<number>('GITLAB_MONITORING_HEALTH_CHECK_INTERVAL', 60),
      enableMetricsCollection: this.configService.get<boolean>('GITLAB_MONITORING_ENABLE_METRICS', true),
      metricsCollectionInterval: this.configService.get<number>('GITLAB_MONITORING_METRICS_COLLECTION_INTERVAL', 300),
    };
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    this.validateApiConfig();
    this.validateCacheConfig();
    this.validateSyncConfig();
    this.validateWebhookConfig();
    this.validateLoggingConfig();
    this.validateMonitoringConfig();
  }

  /**
   * 验证API配置
   */
  private validateApiConfig(): void {
    const { timeout, maxRetries, retryDelay, requestInterval, maxConcurrency } = this.config.api;

    if (timeout <= 0) {
      throw new Error('API超时时间必须大于0');
    }
    if (maxRetries < 0) {
      throw new Error('最大重试次数不能小�?');
    }
    if (retryDelay < 0) {
      throw new Error('重试延迟不能小于0');
    }
    if (requestInterval < 0) {
      throw new Error('请求间隔不能小于0');
    }
    if (maxConcurrency <= 0) {
      throw new Error('最大并发数必须大于0');
    }
  }

  /**
   * 验证缓存配置
   */
  private validateCacheConfig(): void {
    const { ttl, maxSize, compressionLevel } = this.config.cache;

    if (ttl <= 0) {
      throw new Error('缓存TTL必须大于0');
    }
    if (maxSize <= 0) {
      throw new Error('最大缓存数量必须大�?');
    }
    if (compressionLevel < 1 || compressionLevel > 9) {
      throw new Error('压缩级别必须�?-9之间');
    }
  }

  /**
   * 验证同步配置
   */
  private validateSyncConfig(): void {
    const { batchSize, concurrency, timeout, retryCount, retryDelay, syncInterval } = this.config.sync;

    if (batchSize <= 0) {
      throw new Error('批处理大小必须大�?');
    }
    if (concurrency <= 0) {
      throw new Error('并发数必须大�?');
    }
    if (timeout <= 0) {
      throw new Error('同步超时时间必须大于0');
    }
    if (retryCount < 0) {
      throw new Error('重试次数不能小于0');
    }
    if (retryDelay < 0) {
      throw new Error('重试延迟不能小于0');
    }
    if (syncInterval <= 0) {
      throw new Error('同步间隔必须大于0');
    }
  }

  /**
   * 验证Webhook配置
   */
  private validateWebhookConfig(): void {
    const { timeout, maxRetries, retryDelay } = this.config.webhook;

    if (timeout <= 0) {
      throw new Error('Webhook超时时间必须大于0');
    }
    if (maxRetries < 0) {
      throw new Error('Webhook最大重试次数不能小�?');
    }
    if (retryDelay < 0) {
      throw new Error('Webhook重试延迟不能小于0');
    }
  }

  /**
   * 验证日志配置
   */
  private validateLoggingConfig(): void {
    const { maxFileSize, maxFiles } = this.config.logging;

    if (maxFileSize <= 0) {
      throw new Error('日志文件最大大小必须大�?');
    }
    if (maxFiles <= 0) {
      throw new Error('保留的日志文件数量必须大�?');
    }
  }

  /**
   * 验证监控配置
   */
  private validateMonitoringConfig(): void {
    const { healthCheckInterval, metricsCollectionInterval } = this.config.monitoring;

    if (healthCheckInterval <= 0) {
      throw new Error('健康检查间隔必须大�?');
    }
    if (metricsCollectionInterval <= 0) {
      throw new Error('指标收集间隔必须大于0');
    }
  }
}
