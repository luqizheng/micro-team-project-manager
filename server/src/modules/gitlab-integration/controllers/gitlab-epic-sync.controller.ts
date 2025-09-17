import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { GitLabEpicSyncService } from '../services/gitlab-epic-sync.service';
import { IsEnum, IsString, IsUUID, IsOptional } from 'class-validator';

/**
 * GitLab Epic同步控制器
 * 提供PM系统实体与GitLab Epic的双向同步功能
 */
@Controller('gitlab/epic-sync')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GitLabEpicSyncController {
  constructor(private readonly epicSyncService: GitLabEpicSyncService) {}

  /**
   * 同步PM实体到GitLab Epic
   */
  @Post('sync-to-gitlab')
  @Roles('admin', 'project_manager')
  async syncToGitLabEpic(
    @Body() body: {
      projectId: string;
      entityType: 'requirement' | 'subsystem' | 'feature_module';
      entityId: string;
    },
  ) {
    const { projectId, entityType, entityId } = body;

    if (!projectId || !entityType || !entityId) {
      throw new HttpException('缺少必要参数', HttpStatus.BAD_REQUEST);
    }

    const result = await this.epicSyncService.syncToGitLabEpic(
      projectId,
      entityType,
      entityId,
    );

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return {
      success: true,
      data: {
        epicId: result.epicId,
        message: result.message,
      },
    };
  }

  /**
   * 从GitLab同步Epic到PM系统
   */
  @Post('sync-from-gitlab')
  @Roles('admin', 'project_manager')
  async syncFromGitLabEpic(
    @Body() body: {
      instanceId: string;
      groupId: number;
      epicId: number;
    },
  ) {
    const { instanceId, groupId, epicId } = body;

    if (!instanceId || !groupId || !epicId) {
      throw new HttpException('缺少必要参数', HttpStatus.BAD_REQUEST);
    }

    const result = await this.epicSyncService.syncFromGitLabEpic(
      instanceId,
      groupId,
      epicId,
    );

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return {
      success: true,
      data: {
        entityId: result.entityId,
        message: result.message,
      },
    };
  }

  /**
   * 获取实体的Epic映射信息
   */
  @Get('mapping/:projectId/:entityType/:entityId')
  @Roles('admin', 'project_manager', 'member')
  async getEntityEpicMapping(
    @Param('projectId') projectId: string,
    @Param('entityType') entityType: 'requirement' | 'subsystem' | 'feature_module',
    @Param('entityId') entityId: string,
  ) {
    const mapping = await this.epicSyncService.getEntityEpicMapping(
      projectId,
      entityType,
      entityId,
    );

    if (!mapping) {
      throw new HttpException('未找到Epic映射', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: mapping,
    };
  }

  /**
   * 删除Epic映射
   */
  @Delete('mapping/:mappingId')
  @Roles('admin', 'project_manager')
  async deleteEpicMapping(@Param('mappingId') mappingId: string) {
    const result = await this.epicSyncService.deleteEpicMapping(mappingId);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * 批量同步项目下的所有实体到GitLab
   */
  @Post('batch-sync-to-gitlab')
  @Roles('admin', 'project_manager')
  async batchSyncToGitLab(
    @Body() body: {
      projectId: string;
      entityTypes?: ('requirement' | 'subsystem' | 'feature_module')[];
    },
  ) {
    const { projectId, entityTypes = ['requirement', 'subsystem', 'feature_module'] } = body;

    if (!projectId) {
      throw new HttpException('缺少项目ID', HttpStatus.BAD_REQUEST);
    }

    const results = [];
    const errors = [];

    for (const entityType of entityTypes) {
      try {
        // 这里需要根据entityType获取对应的实体列表
        // 由于需要访问不同的repository，这里简化处理
        // 实际实现中需要注入相应的服务
        results.push({
          entityType,
          message: `批量同步${entityType}功能待实现`,
        });
      } catch (error) {
        const err = error as any;
        errors.push({
          entityType,
          error: err?.message || 'unknown error',
        });
      }
    }

    return {
      success: true,
      data: {
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length,
      },
    };
  }
}
