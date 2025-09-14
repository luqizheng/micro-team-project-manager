/**
 * GitLab权限相关异常类
 * 定义GitLab权限管理相关的异常
 */

import { HttpStatus } from '@nestjs/common';
import { GitLabIntegrationException } from './gitlab-integration.exception';

/**
 * GitLab权限异常
 */
export class GitLabPermissionException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_PERMISSION_ERROR';
  readonly statusCode = HttpStatus.FORBIDDEN;

  constructor(message: string, details?: any) {
    super(
      `GitLab权限错误: ${message}`,
      HttpStatus.FORBIDDEN,
      'GITLAB_PERMISSION_ERROR',
      details,
    );
  }
}

/**
 * GitLab权限被拒绝异常
 */
export class GitLabPermissionDeniedException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_PERMISSION_DENIED';
  readonly statusCode = HttpStatus.FORBIDDEN;

  constructor(resource: string, action: string, userId: string) {
    super(
      `GitLab权限被拒绝: 用户 ${userId} 对资源 ${resource} 执行操作 ${action} 被拒绝`,
      HttpStatus.FORBIDDEN,
      'GITLAB_PERMISSION_DENIED',
      { resource, action, userId },
    );
  }
}

/**
 * GitLab权限不足异常
 */
export class GitLabInsufficientPermissionsException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_INSUFFICIENT_PERMISSIONS';
  readonly statusCode = HttpStatus.FORBIDDEN;

  constructor(resource: string, requiredLevel: string, actualLevel: string, userId: string) {
    super(
      `GitLab权限不足: 用户 ${userId} 对资源 ${resource} 的权限级别 ${actualLevel} 低于所需级别 ${requiredLevel}`,
      HttpStatus.FORBIDDEN,
      'GITLAB_INSUFFICIENT_PERMISSIONS',
      { resource, requiredLevel, actualLevel, userId },
    );
  }
}

/**
 * GitLab权限配置无效异常
 */
export class GitLabPermissionConfigInvalidException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_PERMISSION_CONFIG_INVALID';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string, details?: any) {
    super(
      `GitLab权限配置无效: ${message}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_PERMISSION_CONFIG_INVALID',
      details,
    );
  }
}

/**
 * GitLab权限资源不存在异常
 */
export class GitLabPermissionResourceNotFoundException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_PERMISSION_RESOURCE_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(resourceType: string, resourceId: string) {
    super(
      `GitLab权限资源不存在: ${resourceType} ${resourceId}`,
      HttpStatus.NOT_FOUND,
      'GITLAB_PERMISSION_RESOURCE_NOT_FOUND',
      { resourceType, resourceId },
    );
  }
}

/**
 * GitLab权限用户不存在异常
 */
export class GitLabPermissionUserNotFoundException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_PERMISSION_USER_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(userId: string) {
    super(
      `GitLab权限用户不存在: ${userId}`,
      HttpStatus.NOT_FOUND,
      'GITLAB_PERMISSION_USER_NOT_FOUND',
      { userId },
    );
  }
}
