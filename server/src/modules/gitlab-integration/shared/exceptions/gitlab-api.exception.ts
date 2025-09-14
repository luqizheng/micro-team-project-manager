/**
 * GitLab API相关异常类
 * 定义GitLab API调用相关的异常
 */

import { HttpStatus } from '@nestjs/common';
import { GitLabIntegrationException } from './gitlab-integration.exception';

/**
 * GitLab API异常
 */
export class GitLabApiException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_API_ERROR';
  readonly statusCode = HttpStatus.BAD_GATEWAY;

  constructor(message: string, details?: any) {
    super(
      `GitLab API错误: ${message}`,
      HttpStatus.BAD_GATEWAY,
      'GITLAB_API_ERROR',
      details,
    );
  }
}

/**
 * GitLab API连接失败异常
 */
export class GitLabApiConnectionFailedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_API_CONNECTION_FAILED';
  readonly statusCode = HttpStatus.BAD_GATEWAY;

  constructor(url: string, reason?: string) {
    super(
      `GitLab API连接失败: ${url}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.BAD_GATEWAY,
      'GITLAB_API_CONNECTION_FAILED',
      { url, reason },
    );
  }
}

/**
 * GitLab API认证失败异常
 */
export class GitLabApiAuthenticationFailedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_API_AUTHENTICATION_FAILED';
  readonly statusCode = HttpStatus.UNAUTHORIZED;

  constructor(instanceId: string) {
    super(
      `GitLab API认证失败: ${instanceId}`,
      HttpStatus.UNAUTHORIZED,
      'GITLAB_API_AUTHENTICATION_FAILED',
      { instanceId },
    );
  }
}

/**
 * GitLab API限流异常
 */
export class GitLabApiRateLimitedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_API_RATE_LIMITED';
  readonly statusCode = HttpStatus.TOO_MANY_REQUESTS;

  constructor(instanceId: string, retryAfter?: number) {
    super(
      `GitLab API请求被限流: ${instanceId}${retryAfter ? `，请在 ${retryAfter} 秒后重试` : ''}`,
      HttpStatus.TOO_MANY_REQUESTS,
      'GITLAB_API_RATE_LIMITED',
      { instanceId, retryAfter },
    );
  }
}

/**
 * GitLab API超时异常
 */
export class GitLabApiTimeoutException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_API_TIMEOUT';
  readonly statusCode = HttpStatus.REQUEST_TIMEOUT;

  constructor(instanceId: string, timeout: number) {
    super(
      `GitLab API请求超时: ${instanceId}，超时时间: ${timeout}ms`,
      HttpStatus.REQUEST_TIMEOUT,
      'GITLAB_API_TIMEOUT',
      { instanceId, timeout },
    );
  }
}

/**
 * GitLab API响应无效异常
 */
export class GitLabApiInvalidResponseException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_API_INVALID_RESPONSE';
  readonly statusCode = HttpStatus.BAD_GATEWAY;

  constructor(instanceId: string, reason?: string) {
    super(
      `GitLab API响应无效: ${instanceId}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.BAD_GATEWAY,
      'GITLAB_API_INVALID_RESPONSE',
      { instanceId, reason },
    );
  }
}
