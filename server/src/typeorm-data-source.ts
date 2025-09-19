import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ProjectEntity } from './modules/projects/project.entity';
import { UserEntity } from './modules/users/user.entity';
import { GitLabInstance } from './modules/gitlab-integration/core/entities/gitlab-instance.entity';
import { GitLabEventLog } from './modules/gitlab-integration/core/entities/gitlab-event-log.entity';
import { GitLabUserMapping } from './modules/gitlab-integration/core/entities/gitlab-user-mapping.entity';
import { GitLabSyncStatus } from './modules/gitlab-integration/core/entities/gitlab-sync-status.entity';
import { GitLabProjectMapping } from './modules/gitlab-integration/core/entities/gitlab-project-mapping.entity';
import { IssueStateEntity } from './modules/issue-states/issue-state.entity';
import { AttachmentEntity } from './modules/attachments/attachment.entity';
import { CommentEntity } from './modules/comments/comment.entity';
import { ReleaseEntity } from './modules/releases/release.entity';
import { MembershipEntity } from './modules/memberships/membership.entity';
import { BoardEntity } from './modules/boards/board.entity';
import { SprintEntity } from './modules/sprints/sprint.entity';
import { BoardColumnEntity } from './modules/boards/board-column.entity';
import { RequirementEntity } from './modules/requirements/requirement.entity';
import { FeatureModuleEntity } from './modules/feature-modules/feature-module.entity';
// 任务与缺陷实体已�?WorkItemEntity 统一替代
import { WorkItemEntity } from './modules/work-items/work-item.entity';
import { GitLabGroupMapping } from './modules/gitlab-integration/core/entities/gitlab-group-mapping.entity';
import { GitLabEpicMapping } from './modules/gitlab-integration/core/entities/gitlab-epic-mapping.entity';

export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [
    ProjectEntity,
    UserEntity,
    GitLabInstance,
    GitLabEventLog,
    GitLabUserMapping,
    GitLabSyncStatus,
    GitLabProjectMapping,
    GitLabGroupMapping,
    GitLabEpicMapping,
    IssueStateEntity,
    AttachmentEntity,
    CommentEntity,
    ReleaseEntity,
    MembershipEntity,
    BoardEntity,
    BoardColumnEntity,
    SprintEntity,
    RequirementEntity,
    FeatureModuleEntity,
    WorkItemEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false, //process.env.NODE_ENV === 'development' ? [/*'query',*/ 'error', 'warn', 'info', 'log', 'schema'] : false,
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // 记录执行时间超过1秒的查询
});


