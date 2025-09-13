import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ProjectEntity } from './modules/projects/project.entity';
import { UserEntity } from './modules/users/user.entity';
import { GitLabInstance } from './modules/gitlab-integration/entities/gitlab-instance.entity';
import { GitLabProjectMapping } from './modules/gitlab-integration/entities/gitlab-project-mapping.entity';
import { GitLabEventLog } from './modules/gitlab-integration/entities/gitlab-event-log.entity';
import { GitLabUserMapping } from './modules/gitlab-integration/entities/gitlab-user-mapping.entity';
import { GitLabSyncStatus } from './modules/gitlab-integration/entities/gitlab-sync-status.entity';
import { IssueStateEntity } from './modules/issue-states/issue-state.entity';
import { IssueEntity } from './modules/issues/issue.entity';
import { AttachmentEntity } from './modules/attachments/attachment.entity';
import { CommentEntity } from './modules/comments/comment.entity';
import { ReleaseEntity } from './modules/releases/release.entity';
import { MembershipEntity } from './modules/memberships/membership.entity';
import { BoardEntity } from './modules/boards/board.entity';
import { SprintEntity } from './modules/sprints/sprint.entity';
import { BoardColumnEntity } from './modules/boards/board-column.entity';
export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [
    ProjectEntity,
    UserEntity,
    GitLabInstance,
    GitLabProjectMapping,
    GitLabEventLog,
    GitLabUserMapping,
    GitLabSyncStatus,
    IssueStateEntity,
    IssueEntity,
    AttachmentEntity,
    CommentEntity,
    ReleaseEntity,

    MembershipEntity,
    BoardEntity,
    BoardColumnEntity,
    SprintEntity,
   
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // 记录执行时间超过1秒的查询
});


