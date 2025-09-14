/**
 * GitLab验证相关异常类
 * 定义GitLab数据验证相关的异常
 */

import { HttpStatus } from '@nestjs/common';
import { GitLabIntegrationException } from './gitlab-integration.exception';

/**
 * GitLab验证异常
 */
export class GitLabValidationException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_VALIDATION_ERROR';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string, details?: any) {
    super(
      `GitLab验证错误: ${message}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_VALIDATION_ERROR',
      details,
    );
  }
}

/**
 * GitLab字段验证异常
 */
export class GitLabFieldValidationException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_FIELD_VALIDATION_ERROR';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(field: string, message: string, value?: any) {
    super(
      `GitLab字段验证错误: ${field} - ${message}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_FIELD_VALIDATION_ERROR',
      { field, message, value },
    );
  }
}

/**
 * GitLab必填字段缺失异常
 */
export class GitLabRequiredFieldMissingException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_REQUIRED_FIELD_MISSING';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(field: string) {
    super(
      `GitLab必填字段缺失: ${field}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_REQUIRED_FIELD_MISSING',
      { field },
    );
  }
}

/**
 * GitLab字段格式无效异常
 */
export class GitLabFieldFormatInvalidException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_FIELD_FORMAT_INVALID';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(field: string, format: string, value: any) {
    super(
      `GitLab字段格式无效: ${field}，期望格式: ${format}，实际值: ${value}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_FIELD_FORMAT_INVALID',
      { field, format, value },
    );
  }
}

/**
 * GitLab字段长度超出限制异常
 */
export class GitLabFieldLengthExceededException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_FIELD_LENGTH_EXCEEDED';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(field: string, maxLength: number, actualLength: number) {
    super(
      `GitLab字段长度超出限制: ${field}，最大长度: ${maxLength}，实际长度: ${actualLength}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_FIELD_LENGTH_EXCEEDED',
      { field, maxLength, actualLength },
    );
  }
}

/**
 * GitLab字段值超出范围异常
 */
export class GitLabFieldValueOutOfRangeException extends GitLabIntegrationException {
  readonly errorCode = 'GITLAB_FIELD_VALUE_OUT_OF_RANGE';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(field: string, min: number, max: number, value: number) {
    super(
      `GitLab字段值超出范围: ${field}，范围: ${min}-${max}，实际值: ${value}`,
      HttpStatus.BAD_REQUEST,
      'GITLAB_FIELD_VALUE_OUT_OF_RANGE',
      { field, min, max, value },
    );
  }
}
