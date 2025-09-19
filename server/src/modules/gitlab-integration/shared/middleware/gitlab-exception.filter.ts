/**
 * GitLab异常过滤�?
 * 统一处理GitLab集成功能中的异常
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GitLabIntegrationException } from '../exceptions/gitlab-integration.exception';
import { GitLabErrorCodes, GitLabErrorDescriptions } from '../constants/gitlab-error-codes';

/**
 * 错误响应DTO
 */
export interface ErrorResponseDto {
  /** 错误�?*/
  errorCode: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
  /** 时间�?*/
  timestamp: string;
  /** 请求路径 */
  path: string;
  /** 请求方法 */
  method: string;
  /** 请求ID */
  requestId?: string;
}

/**
 * GitLab异常过滤�?
 * 捕获并处理GitLab集成功能中的异常
 */
@Catch()
export class GitLabExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GitLabExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // 记录错误日志
    this.logError(exception, request, errorResponse);

    // 发送错误响�?
    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(exception: unknown, request: Request): ErrorResponseDto & { statusCode: number } {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const requestId = request.headers['x-request-id'] as string;

    // 处理GitLab集成异常
    if (exception instanceof GitLabIntegrationException) {
      return {
        errorCode: exception.errorCode,
        message: exception.message,
        details: exception.getResponse(),
        timestamp,
        path,
        method,
        requestId,
        statusCode: exception.statusCode,
      };
    }

    // 处理HTTP异常
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      return {
        errorCode: this.getErrorCodeFromStatus(status),
        message: typeof response === 'string' ? response : (response as any).message || 'HTTP异常',
        details: typeof response === 'object' ? response : undefined,
        timestamp,
        path,
        method,
        requestId,
        statusCode: status,
      };
    }

    // 处理未知异常
    const message = exception instanceof Error ? exception.message : '未知错误';
    const errorCode = GitLabErrorCodes.INTERNAL_ERROR;

    return {
      errorCode,
      message: GitLabErrorDescriptions[errorCode] || message,
      details: {
        originalError: exception instanceof Error ? exception.stack : String(exception),
      },
      timestamp,
      path,
      method,
      requestId,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  /**
   * 根据HTTP状态码获取错误�?
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return GitLabErrorCodes.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return GitLabErrorCodes.API_AUTHENTICATION_FAILED;
      case HttpStatus.FORBIDDEN:
        return GitLabErrorCodes.PERMISSION_DENIED;
      case HttpStatus.NOT_FOUND:
        return GitLabErrorCodes.INSTANCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return GitLabErrorCodes.INSTANCE_ALREADY_EXISTS;
      case HttpStatus.REQUEST_TIMEOUT:
        return GitLabErrorCodes.API_TIMEOUT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return GitLabErrorCodes.API_RATE_LIMITED;
      case HttpStatus.BAD_GATEWAY:
        return GitLabErrorCodes.API_CONNECTION_FAILED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return GitLabErrorCodes.EXTERNAL_SERVICE_ERROR;
      default:
        return GitLabErrorCodes.INTERNAL_ERROR;
    }
  }

  /**
   * 记录错误日志
   */
  private logError(exception: unknown, request: Request, errorResponse: ErrorResponseDto & { statusCode: number }): void {
    const { errorCode, message, statusCode } = errorResponse;
    const { method, url, headers, body } = request;

    // 根据错误级别记录日志
    if (statusCode >= 500) {
      this.logger.error(
        `GitLab集成错误: ${errorCode} - ${message}`,
        {
          errorCode,
          message,
          statusCode,
          method,
          url,
          userAgent: headers['user-agent'],
          body: body ? JSON.stringify(body) : undefined,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `GitLab集成警告: ${errorCode} - ${message}`,
        {
          errorCode,
          message,
          statusCode,
          method,
          url,
          userAgent: headers['user-agent'],
        },
      );
    } else {
      this.logger.log(
        `GitLab集成信息: ${errorCode} - ${message}`,
        {
          errorCode,
          message,
          statusCode,
          method,
          url,
        },
      );
    }
  }
}
