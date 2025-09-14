/**
 * GitLab缓存服务
 * 负责GitLab集成功能的数据缓存管理
 */

import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ICacheService, CacheConfig, CacheStats } from '../../core/interfaces/gitlab-cache.interface';
import { GitLabConfigService } from '../config/gitlab-config.service';

/**
 * GitLab缓存服务
 * 提供GitLab集成功能的数据缓存管理
 */
@Injectable()
export class GitLabCacheService implements ICacheService {
  private readonly logger = new Logger(GitLabCacheService.name);
  private readonly config: CacheConfig;
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    memoryUsage: 0,
  };

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: GitLabConfigService,
  ) {
    this.config = this.configService.getCacheConfig();
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    try {
      const fullKey = this.buildKey(key);
      const value = await this.cacheManager.get<T>(fullKey);
      
      if (value !== null && value !== undefined) {
        this.stats.hits++;
        this.logger.debug(`缓存命中: ${fullKey}`);
      } else {
        this.stats.misses++;
        this.logger.debug(`缓存未命中: ${fullKey}`);
      }
      
      this.updateHitRate();
      return value as T | null;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const fullKey = this.buildKey(key);
      const cacheTtl = ttl || this.config.ttl;
      
      await this.cacheManager.set(fullKey, value, cacheTtl * 1000); // 转换为毫秒
      this.stats.size++;
      
      this.logger.debug(`设置缓存: ${fullKey}, TTL: ${cacheTtl}s`);
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(key: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const fullKey = this.buildKey(key);
      await this.cacheManager.del(fullKey);
      this.stats.size = Math.max(0, this.stats.size - 1);
      
      this.logger.debug(`删除缓存: ${fullKey}`);
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      await this.cacheManager.clear();
      this.stats.size = 0;
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.hitRate = 0;
      
      this.logger.debug('清空所有缓存');
    } catch (error) {
      this.logger.error('清空缓存失败', error);
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key);
      const value = await this.cacheManager.get(fullKey);
      return value !== null && value !== undefined;
    } catch (error) {
      this.logger.error(`检查缓存存在性失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存剩余生存时间
   */
  async ttl(key: string): Promise<number> {
    if (!this.config.enabled) {
      return -1;
    }

    try {
      const fullKey = this.buildKey(key);
      // 注意：cache-manager 可能不支持 TTL 查询
      // 这里返回 -1 表示不支持或无法获取
      return -1;
    } catch (error) {
      this.logger.error(`获取缓存TTL失败: ${key}`, error);
      return -1;
    }
  }

  /**
   * 设置缓存剩余生存时间
   */
  async expire(key: string, ttl: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const fullKey = this.buildKey(key);
      const value = await this.cacheManager.get(fullKey);
      
      if (value !== null && value !== undefined) {
        await this.cacheManager.set(fullKey, value, ttl * 1000);
        this.logger.debug(`设置缓存TTL: ${fullKey}, TTL: ${ttl}s`);
      }
    } catch (error) {
      this.logger.error(`设置缓存TTL失败: ${key}`, error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 重置缓存统计信息
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.hitRate = 0;
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
  }

  /**
   * 构建缓存键
   */
  private buildKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * 检查缓存是否已满
   */
  private isCacheFull(): boolean {
    return this.stats.size >= this.config.maxSize;
  }

  /**
   * 清理过期缓存（如果支持）
   */
  private async cleanupExpiredCache(): Promise<void> {
    // 注意：cache-manager 通常会自动清理过期缓存
    // 这里可以添加额外的清理逻辑
  }
}
