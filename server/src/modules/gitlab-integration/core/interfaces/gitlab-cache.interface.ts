/**
 * GitLab缓存服务接口
 * 定义GitLab缓存功能的核心接�?
 */

/**
 * 缓存服务接口
 * 负责数据的缓存管�?
 */
export interface ICacheService {
  /**
   * 获取缓存数据
   * @param key 缓存�?
   * @returns 缓存数据或null
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 设置缓存数据
   * @param key 缓存�?
   * @param value 缓存�?
   * @param ttl 生存时间（秒�?
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 删除缓存数据
   * @param key 缓存�?
   */
  delete(key: string): Promise<void>;

  /**
   * 清空所有缓�?
   */
  clear(): Promise<void>;

  /**
   * 检查缓存是否存�?
   * @param key 缓存�?
   * @returns 是否存在
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取缓存剩余生存时间
   * @param key 缓存�?
   * @returns 剩余时间（秒�?
   */
  ttl(key: string): Promise<number>;

  /**
   * 设置缓存剩余生存时间
   * @param key 缓存�?
   * @param ttl 生存时间（秒�?
   */
  expire(key: string, ttl: number): Promise<void>;
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
}

/**
 * 缓存统计接口
 */
export interface CacheStats {
  /** 命中次数 */
  hits: number;
  /** 未命中次�?*/
  misses: number;
  /** 命中�?*/
  hitRate: number;
  /** 缓存数量 */
  size: number;
  /** 内存使用量（字节�?*/
  memoryUsage: number;
}
