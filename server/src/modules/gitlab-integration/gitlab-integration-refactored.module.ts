/**
 * GitLab集成模块（重构版）
 * 使用分层架构设计
 */

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// 导入其他模块
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';

// 导入核心实体
import {
  GitLabInstance,
  GitLabProjectMapping,
  GitLabUserMapping,
  GitLabEventLog,
  GitLabSyncStatus,
} from './core/entities';

// 导入基础设施服务
import {
  GitLabConfigService,
  GitLabCacheService,
  GitLabApiClient,
  GitLabInstanceRepository,
  GitLabProjectMappingRepository,
  GitLabUserMappingRepository,
  GitLabEventLogRepository,
} from './infrastructure';

// 导入应用服务
import { GitLabIntegrationService } from './application/services';
import { GitLabPermissionsService } from './services/gitlab-permissions.service';
import { GitLabSyncService } from './services/gitlab-sync.service';
import { GitLabWebhookService } from './services/gitlab-webhook.service';

// 导入控制器
import {
  GitLabIntegrationController,
  GitLabPermissionsController,
  GitLabSyncManagementController,
  GitLabWebhookController,
} from './presentation/controllers';

/**
 * GitLab集成模块
 * 提供GitLab实例管理、项目映射、权限控制、数据同步等功能
 */
@Module({
  imports: [
    // 数据库实体
    TypeOrmModule.forFeature([
      GitLabInstance,
      GitLabProjectMapping,
      GitLabUserMapping,
      GitLabEventLog,
      GitLabSyncStatus,
    ]),
    
    // HTTP模块
    HttpModule,
    
    // 配置模块
    ConfigModule,
    
    // 其他功能模块
    ProjectsModule,
    UsersModule,
    MembershipsModule,
  ],
  
  providers: [
    // 基础设施服务
    GitLabConfigService,
    GitLabCacheService,
    GitLabApiClient,
    GitLabInstanceRepository,
    GitLabProjectMappingRepository,
    GitLabUserMappingRepository,
    GitLabEventLogRepository,
    
    // 应用服务
    GitLabIntegrationService,
    GitLabPermissionsService,
    GitLabSyncService,
    GitLabWebhookService,
  ],
  
  controllers: [
    GitLabIntegrationController,
    GitLabPermissionsController,
    GitLabSyncManagementController,
    GitLabWebhookController,
  ],
  
  exports: [
    // 导出核心服务供其他模块使用
    GitLabIntegrationService,
    GitLabPermissionsService,
    GitLabSyncService,
    GitLabWebhookService,
    GitLabApiClient,
    GitLabConfigService,
  ],
})
export class GitLabIntegrationRefactoredModule {}
