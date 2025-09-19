/**
 * GitLab集成基础异常�?
 * 定义GitLab集成功能的基础异常
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * GitLab集成基础异常�?
 * 所有GitLab集成相关异常的基�?
 */
export abstract class GitLabIntegrationException extends HttpException {
  /** 错误�?*/
  readonly errorCode: string;
  /** HTTP状态码 */
  readonly statusCode: HttpStatus;

  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode: string,
    details?: any,
  ) {
    super(
      {
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}
