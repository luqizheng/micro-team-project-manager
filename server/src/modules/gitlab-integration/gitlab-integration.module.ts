import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
// import { ScheduleModule } from '@nestjs/schedule';

// 实体
import {
  GitLabInstance,
  GitLabProjectMapping,
  GitLabEventLog,
  GitLabUserMapping,
  GitLabSyncStatus,
  GitLabEpicMapping,
} from './entities';

// 服务
import {
  GitLabApiGitBeakerService,
  GitLabWebhookService,
  GitLabSyncService,
  GitLabIntegrationService,
  GitLabEventProcessorService,
  GitLabEventQueueService,
  GitLabEventDeduplicationService,
  GitLabUserSyncService,
  GitLabIncrementalSyncService,
  GitLabPermissionsService,
  GitLabEpicSyncService,
} from './services';

// 控制器
import {
  GitLabWebhookController,
  GitLabIntegrationController,
  GitLabSyncManagementController,
  GitLabPermissionsController,
  GitLabEpicSyncController,
} from './controllers';

// 其他模块
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';

// 实体导入
import { ProjectEntity } from '../projects/project.entity';
import { UserEntity } from '../users/user.entity';

import { RequirementEntity } from '../requirements/requirement.entity';

import { FeatureModuleEntity } from '../feature-modules/feature-module.entity';

/**
 * GitLab集成模块
 * 提供GitLab自托管实例的集成功能
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule,
    
    // 定时任务模块
    // ScheduleModule.forRoot(),
    
    // HTTP模块
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    
    // 数据库实体
    TypeOrmModule.forFeature([
      GitLabInstance,
      GitLabProjectMapping,
      GitLabEventLog,
      GitLabUserMapping,
      GitLabSyncStatus,
      GitLabEpicMapping,
      ProjectEntity,
      UserEntity,
   
      RequirementEntity,
    
      FeatureModuleEntity,
    ]),
    
    // 其他模块
    forwardRef(() => ProjectsModule),
    UsersModule,
    MembershipsModule,
  ],
  
  // 控制器
  controllers: [
    GitLabWebhookController,
    GitLabIntegrationController,
    GitLabSyncManagementController,
    GitLabPermissionsController,
    GitLabEpicSyncController,
  ],
  
  // 服务
  providers: [
    GitLabApiGitBeakerService,
    GitLabWebhookService,
    GitLabSyncService,
    GitLabIntegrationService,
    GitLabEventProcessorService,
    GitLabEventQueueService,
    GitLabEventDeduplicationService,
    GitLabUserSyncService,
    GitLabIncrementalSyncService,
    GitLabPermissionsService,
    GitLabEpicSyncService,
  ],
  
  // 导出服务（供其他模块使用）
  exports: [
    GitLabApiGitBeakerService,
    GitLabWebhookService,
    GitLabSyncService,
    GitLabIntegrationService,
    GitLabEventProcessorService,
    GitLabEventQueueService,
    GitLabEventDeduplicationService,
    GitLabUserSyncService,
    GitLabIncrementalSyncService,
    GitLabPermissionsService,
    GitLabEpicSyncService,
  ],
})
export class GitLabIntegrationModule {}
