/**
 * GitLab实例相关异常�?
 * 定义GitLab实例管理相关的异�?
 */

import { HttpStatus } from '@nestjs/common';
import { GitLabIntegrationException } from './gitlab-integration.exception';

/**
 * GitLab实例未找到异�?
 */
export class GitLabInstanceNotFoundException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_INSTANCE_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(instanceId: string) {
    super(
      `GitLab实例未找�? ${instanceId}`,
      HttpStatus.NOT_FOUND,
      'GITLAB_INSTANCE_NOT_FOUND',
      { instanceId },
    );
  }
}

/**
 * GitLab实例已存在异�?
 */
export class GitLabInstanceAlreadyExistsException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_INSTANCE_ALREADY_EXISTS';
  readonly statusCode = HttpStatus.CONFLICT;

  constructor(baseUrl: string) {
    super(
      `GitLab实例已存�? ${baseUrl}`,
      HttpStatus.CONFLICT,
      'GITLAB_INSTANCE_ALREADY_EXISTS',
      { baseUrl },
    );
  }
}

/**
 * GitLab实例配置无效异常
 */
export class GitLabInstanceInvalidConfigException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_INSTANCE_INVALID_CONFIG';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string, details?: any) {
    super(
      `GitLab实例配置无效: ${message}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_INSTANCE_INVALID_CONFIG',
      details,
    );
  }
}

/**
 * GitLab实例连接失败异常
 */
export class GitLabInstanceConnectionFailedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_INSTANCE_CONNECTION_FAILED';
  readonly statusCode = HttpStatus.BAD_GATEWAY;

  constructor(instanceId: string, reason?: string) {
    super(
      `GitLab实例连接失败: ${instanceId}${reason ? ` - ${reason}` : ''}`,
      HttpStatus.BAD_GATEWAY,
      'GITLAB_INSTANCE_CONNECTION_FAILED',
      { instanceId, reason },
    );
  }
}

/**
 * GitLab实例认证失败异常
 */
export class GitLabInstanceAuthenticationFailedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_INSTANCE_AUTHENTICATION_FAILED';
  readonly statusCode = HttpStatus.UNAUTHORIZED;

  constructor(instanceId: string) {
    super(
      `GitLab实例认证失败: ${instanceId}`,
      HttpStatus.UNAUTHORIZED,
      'GITLAB_INSTANCE_AUTHENTICATION_FAILED',
      { instanceId },
    );
  }
}
