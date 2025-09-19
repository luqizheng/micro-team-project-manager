import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
// import { ScheduleModule } from '@nestjs/schedule';

// 实体
import {
  GitLabInstance,
  GitLabEventLog,
  GitLabUserMapping,
  GitLabSyncStatus,
  GitLabEpicMapping,
  GitLabGroupMapping,
} from './entities';
import { GitLabProjectMapping } from './core/entities/gitlab-project-mapping.entity';

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
  GitLabGroupMappingService,
} from './services';
import { GitLabGroupIntegrationService } from './application/services/gitlab-group-integration.service';
import { GitLabProjectMappingRepository } from './infrastructure/repositories/gitlab-project-mapping.repository';
import { GitLabInstanceRepository } from './infrastructure/repositories/gitlab-instance.repository';
import { GitLabGroupMappingRepository } from './infrastructure/repositories/gitlab-group-mapping.repository';
import { GitLabCacheService } from './infrastructure/cache/gitlab-cache.service';
import { GitLabConfigService } from './infrastructure/config/gitlab-config.service';

// 控制器
import {
  GitLabWebhookController,
  GitLabIntegrationController,
  GitLabSyncManagementController,
  GitLabPermissionsController,
  GitLabEpicSyncController,
  ProjectGroupMappingController,
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
import { WorkItemEntity } from '../work-items/work-item.entity';

/**
 * GitLab集成模块
 * 提供GitLab自托管实例的集成功能
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule,
    
    // 缓存模块
    CacheModule.register({
      ttl: 300, // 默认5分钟缓存
      max: 1000, // 最大缓存条目数
    }),
    
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
      GitLabEventLog,
      GitLabUserMapping,
      GitLabSyncStatus,
      GitLabEpicMapping,
      GitLabGroupMapping,
      GitLabProjectMapping,
      ProjectEntity,
      UserEntity,
   
      RequirementEntity,
    
      FeatureModuleEntity,
      WorkItemEntity,
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
    ProjectGroupMappingController,
  ],
  
  // 服务
  providers: [
    GitLabApiGitBeakerService,
    GitLabWebhookService,
    GitLabSyncService,
    GitLabIntegrationService,
    GitLabGroupIntegrationService,
    GitLabEventProcessorService,
    GitLabEventQueueService,
    GitLabEventDeduplicationService,
    GitLabUserSyncService,
    GitLabIncrementalSyncService,
    GitLabPermissionsService,
    GitLabEpicSyncService,
    GitLabGroupMappingService,
    GitLabCacheService,
    GitLabConfigService,
    GitLabProjectMappingRepository,
    // 接口提供
    {
      provide: 'IGitLabInstanceRepository',
      useClass: GitLabInstanceRepository,
    },
    {
      provide: 'IGitLabGroupMappingRepository',
      useClass: GitLabGroupMappingRepository,
    },
    {
      provide: 'IGitLabApiClient',
      useClass: GitLabApiGitBeakerService,
    },
  ],
  
  // 导出服务（供其他模块使用）
  exports: [
    GitLabApiGitBeakerService,
    GitLabWebhookService,
    GitLabSyncService,
    GitLabIntegrationService,
    GitLabGroupIntegrationService,
    GitLabEventProcessorService,
    GitLabEventQueueService,
    GitLabEventDeduplicationService,
    GitLabUserSyncService,
    GitLabIncrementalSyncService,
    GitLabPermissionsService,
    GitLabEpicSyncService,
    GitLabGroupMappingService,
    GitLabCacheService,
    GitLabConfigService,
  ],
})
export class GitLabIntegrationModule {}
