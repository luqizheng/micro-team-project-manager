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
} from './services';

// 控制器
import {
  GitLabWebhookController,
  GitLabIntegrationController,
  GitLabSyncManagementController,
  GitLabPermissionsController,
} from './controllers';

// 其他模块
import { ProjectsModule } from '../projects/projects.module';
import { IssuesModule } from '../issues/issues.module';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';

// 实体导入
import { IssueEntity } from '../issues/issue.entity';
import { ProjectEntity } from '../projects/project.entity';
import { UserEntity } from '../users/user.entity';

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
      IssueEntity,
      ProjectEntity,
      UserEntity,
    ]),
    
    // 其他模块
    ProjectsModule,
    forwardRef(() => IssuesModule),
    UsersModule,
    MembershipsModule,
  ],
  
  // 控制器
  controllers: [
    GitLabWebhookController,
    GitLabIntegrationController,
    GitLabSyncManagementController,
    GitLabPermissionsController,
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
  ],
})
export class GitLabIntegrationModule {}
