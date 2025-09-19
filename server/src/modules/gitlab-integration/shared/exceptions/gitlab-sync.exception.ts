/**
 * GitLab同步相关异常�?
 * 定义GitLab同步功能相关的异�?
 */

import { HttpStatus } from '@nestjs/common';
import { GitLabIntegrationException } from './gitlab-integration.exception';

/**
 * GitLab同步异常
 */
export class GitLabSyncException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_SYNC_ERROR';
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

  constructor(message: string, details?: any) {
    super(
      `GitLab同步错误: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'GITLAB_SYNC_ERROR',
      details,
    );
  }
}

/**
 * GitLab同步进行中异�?
 */
export class GitLabSyncInProgressException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_SYNC_IN_PROGRESS';
  readonly statusCode = HttpStatus.CONFLICT;

  constructor(instanceId: string, syncType: string) {
    super(
      `GitLab同步正在进行�? ${instanceId}，同步类�? ${syncType}`,
      HttpStatus.CONFLICT,
      'GITLAB_SYNC_IN_PROGRESS',
      { instanceId, syncType },
    );
  }
}

/**
 * GitLab同步失败异常
 */
export class GitLabSyncFailedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_SYNC_FAILED';
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

  constructor(instanceId: string, reason?: string) {
    super(
      `GitLab同步失败: ${instanceId}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'GITLAB_SYNC_FAILED',
      { instanceId, reason },
    );
  }
}

/**
 * GitLab同步超时异常
 */
export class GitLabSyncTimeoutException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_SYNC_TIMEOUT';
  readonly statusCode = HttpStatus.REQUEST_TIMEOUT;

  constructor(instanceId: string, timeout: number) {
    super(
      `GitLab同步超时: ${instanceId}，超时时�? ${timeout}ms`,
      HttpStatus.REQUEST_TIMEOUT,
      'GITLAB_SYNC_TIMEOUT',
      { instanceId, timeout },
    );
  }
}

/**
 * GitLab同步配置无效异常
 */
export class GitLabSyncInvalidConfigException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_SYNC_INVALID_CONFIG';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string, details?: any) {
    super(
      `GitLab同步配置无效: ${message}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_SYNC_INVALID_CONFIG',
      details,
    );
  }
}

/**
 * GitLab同步数据无效异常
 */
export class GitLabSyncInvalidDataException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_SYNC_INVALID_DATA';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string, details?: any) {
    super(
      `GitLab同步数据无效: ${message}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_SYNC_INVALID_DATA',
      details,
    );
  }
}
