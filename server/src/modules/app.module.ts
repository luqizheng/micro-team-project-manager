import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { SprintsModule } from './sprints/sprints.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MembershipsModule } from './memberships/memberships.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { CommentsModule } from './comments/comments.module';
import { ReleasesModule } from './releases/releases.module';
import { ReportsModule } from './reports/reports.module';
import { IssueStatesModule } from './issue-states/issue-states.module';
import { BoardsModule } from './boards/boards.module';
import { CommonModule } from '../common/common.module';
import Joi from 'joi';
import { AppInitializer } from '../app.initializer';
import { CustomTypeOrmLogger } from '../common/logger/typeorm-logger';
import { GitLabIntegrationModule } from './gitlab-integration/gitlab-integration.module';
import { RequirementsModule } from './requirements/requirements.module';
import { SubsystemsModule } from './subsystems/subsystems.module';
import { FeatureModulesModule } from './feature-modules/feature-modules.module';
import { TasksModule } from './tasks/tasks.module';
import { BugsModule } from './bugs/bugs.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().port().default(3000),
        DATABASE_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().min(6).required(),
        ADMIN_EMAILS: Joi.string().allow('').optional(),
        ADMIN_DEFAULT_PASSWORD: Joi.string().allow('').optional(),
        S3_ENDPOINT: Joi.string().uri().allow('').optional(),
        S3_ACCESS_KEY: Joi.string().allow('').optional(),
        S3_SECRET_KEY: Joi.string().allow('').optional(),
        S3_BUCKET: Joi.string().allow('').optional(),
        S3_REGION: Joi.string().allow('').optional(),
        S3_USE_SSL: Joi.boolean().optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development' ? ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
        logger: config.get<string>('NODE_ENV') === 'development' ? new CustomTypeOrmLogger() : 'simple-console',
        maxQueryExecutionTime: 1000, // 记录执行时间超过1秒的查询
      }),
    }),
    CommonModule,
    HealthModule,
    UsersModule,
    MembershipsModule,
    AuthModule,
    ProjectsModule,
    SprintsModule,
    AttachmentsModule,
    CommentsModule,
    ReleasesModule,
    ReportsModule,
    IssueStatesModule,
    BoardsModule,
    GitLabIntegrationModule,
    // 新的层级结构模块
    RequirementsModule,
    SubsystemsModule,
    FeatureModulesModule,
    TasksModule,
    BugsModule,
    HierarchyModule,
  ],
  providers: [AppInitializer],
})
export class AppModule {}


