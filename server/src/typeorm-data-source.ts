import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ProjectEntity } from './modules/projects/project.entity';
import { GitLabInstance } from './modules/gitlab-integration/entities/gitlab-instance.entity';
import { GitLabProjectMapping } from './modules/gitlab-integration/entities/gitlab-project-mapping.entity';
import { GitLabEventLog } from './modules/gitlab-integration/entities/gitlab-event-log.entity';
import { GitLabUserMapping } from './modules/gitlab-integration/entities/gitlab-user-mapping.entity';
import { GitLabSyncStatus } from './modules/gitlab-integration/entities/gitlab-sync-status.entity';

export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [
    ProjectEntity,
    GitLabInstance,
    GitLabProjectMapping,
    GitLabEventLog,
    GitLabUserMapping,
    GitLabSyncStatus,
   
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // 记录执行时间超过1秒的查询
});


