import axios from 'axios';
import { message } from 'ant-design-vue';
import router from '../router';

// 简单 GET 缓存与请求去重
type CacheEntry = { expireAt: number; data: any };
const GET_CACHE = new Map<string, CacheEntry>();
const PENDING = new Map<string, Promise<any>>();
const DEFAULT_TTL_MS = 10_000; // 10s，可按需调整

// 记录上一次使用的 token，用于在 token 发生变更时主动清理缓存，避免跨用户读到旧数据
let LAST_TOKEN: string | null = ((): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
})();

function buildKey(config: any) {
  const url = config.baseURL ? config.baseURL + config.url : config.url;
  const params = config.params ? JSON.stringify(config.params) : '';
  // 将 Authorization 参与 key 计算，避免不同登录态之间的 GET 缓存串号
  const auth = (config.headers && (config.headers as any).Authorization) || '';
  return `${config.method || 'get'}:${url}?${params}#${auth}`;
}

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // token 变化时，清空 GET 缓存与进行中标记，防止跨用户返回旧数据
    if (token !== LAST_TOKEN) {
      GET_CACHE.clear();
      PENDING.clear();
      LAST_TOKEN = token;
    }
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // GET 缓存与去重
    if ((config.method || 'get').toLowerCase() === 'get') {
      const key = buildKey(config);
      // 缓存命中
      const entry = GET_CACHE.get(key);
      if (entry && entry.expireAt > Date.now()) {
        // 通过返回一个可被 then 的 Promise 来短路
        return Promise.reject({ __fromCache: true, __cacheData: entry.data, config });
      }
      // 合并并发
      const pending = PENDING.get(key);
      if (pending) {
        return Promise.reject({ __fromPending: true, __pending: pending, config });
      }
      // 标记为进行中
      const controller = new AbortController();
      (config as any).__dedupeKey = key;
      (config as any).__signal = controller;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 写入 GET 缓存
    const cfg: any = response.config || {};
    if ((cfg.method || 'get').toLowerCase() === 'get') {
      const key = cfg.__dedupeKey || buildKey(cfg);
      GET_CACHE.set(key, { expireAt: Date.now() + DEFAULT_TTL_MS, data: response });
      PENDING.delete(key);
    }
    // 统一处理业务错误：HTTP 200 但 code 非 0
    const payload = response?.data as any;
    if (payload && typeof payload === 'object' && 'code' in payload) {
      if (payload.code !== 0) {
        const msg = payload.message || '请求失败';
        message.error(msg);
        return Promise.reject({ isBusinessError: true, ...payload });
      }
    }
    return response;
  },
  (error) => {
    // 处理缓存短路或并发合并
    if (error?.__fromCache) {
      return Promise.resolve(error.__cacheData);
    }
    if (error?.__fromPending) {
      return error.__pending;
    }

    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          const current = window.location.pathname + window.location.search;
          if (!current.startsWith('/login')) {
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // 401 时清空缓存，确保后续登录不会读到旧缓存
              GET_CACHE.clear();
              PENDING.clear();
              LAST_TOKEN = null;
            } catch {}
            message.warning('登录已过期，请重新登录');
            router.replace({ path: '/login', query: { redirect: current } });
          }
          break;
        case 403:
          message.error('没有权限访问此资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 422:
          message.error(data?.message || '请求参数错误');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else {
      message.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

export default http;


