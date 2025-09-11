## API 设计（草案）

### 1. 约定
- 前缀：`/api/v1`；鉴权：Bearer JWT；请求与响应：`application/json`；
- 错误规范：`{ code, message, details?, requestId }`；
- 分页：`?page=1&pageSize=20`，返回 `{ items, page, pageSize, total }`；
- 幂等：对外部回调与批量写接口提供 `Idempotency-Key`；
- Webhook：HMAC-SHA256 签名，重试与事件去重。

### 2. 鉴权与用户
- POST `/auth/login` （或 OIDC 回调）；
- POST `/auth/refresh`；GET `/me`；GET `/me/notifications`；PATCH `/me/settings`。

### 3. 项目与成员（字段级）
- GET `/projects`
  - 查询参数：`q?`（string, 名称模糊），`visibility?`（enum: private/public），`page`，`pageSize`
  - 返回项字段：`id`(string), `key`(string, 唯一), `name`(string, 1..80), `visibility`(string), `createdAt`(ISO), `updatedAt`(ISO), `archived`(boolean)
- POST `/projects`
  - 请求：`{ key: string(2..20, /^[A-Z0-9-]+$/), name: string(1..80), visibility: 'private'|'public' }`
  - 约束：`key` 唯一；默认 `visibility='private'`
- GET `/projects/:id`
- PATCH `/projects/:id`
  - 请求：`{ name?: string(1..80), visibility?: 'private'|'public', archived?: boolean }`
- DELETE `/projects/:id`
- GET `/projects/:id/members`
  - 返回：`{ userId, role: 'viewer'|'member'|'project_admin', joinedAt }[]`
- POST `/projects/:id/members`
  - 请求：`{ userId: string, role: 'viewer'|'member'|'project_admin' }`
- DELETE `/projects/:id/members/:userId`
- Webhooks：GET/POST `/projects/:id/webhooks`；POST `/projects/:id/webhooks/:hid/test`；DELETE `/projects/:id/webhooks/:hid`
  - Webhook 字段：`{ id, url: string(https), secret?: string(<=128), events: string[], isActive: boolean, createdAt }`

### 4. 事项（Issue，字段级）
- GET `/projects/:id/issues`
  - 过滤：`type?`('requirement'|'task'|'bug'), `state?`(enum), `assigneeId?`, `label?`, `sprintId?`, `q?`, `page`, `pageSize`, `orderBy?`('updatedAt desc' 默认)
  - 列表项：`{ id, type, title(1..140), state, priority?: 'low'|'medium'|'high'|'urgent', severity?: 'minor'|'major'|'critical', assigneeId?, reporterId, storyPoints?, estimateMinutes?, remainingMinutes?, sprintId?, releaseId?, parentId?, labels: string[], dueAt?, createdAt, updatedAt }`
- POST `/projects/:id/issues`
  - 请求：`{ type: 'requirement'|'task'|'bug', title: string(1..140), description?: string(markdown), priority?, severity?, assigneeId?, storyPoints?: number(>=0), estimateMinutes?: number(>=0), dueAt?: ISO, labels?: string[] }`
  - 约束：`(severity)` 仅 `type='bug'` 合法
- GET `/issues/:iid`
- PATCH `/issues/:iid`
  - 请求：任意字段可选；`state` 受状态机校验；`labels` 覆盖式更新
- DELETE `/issues/:iid`
- POST `/issues/:iid/transition`
  - 请求：`{ to: string }`（示例：InProgress/Blocked/InReview/QA/Done）
- POST `/issues/:iid/assignees`
  - 请求：`{ assigneeId: string|null }`
- 评论：GET/POST `/issues/:iid/comments`
  - 评论字段：`{ id, authorId, body: string(<=10000, markdown), mentions?: string[], createdAt, updatedAt }`
- 附件：POST `/issues/:iid/attachments`
  - 流程：服务端返回预签名直传参数与 `attachmentId`；完成上传后回调 `PUT /attachments/:id/complete`

### 5. 看板
- GET `/projects/:id/boards`、POST `/projects/:id/boards`；
- GET `/boards/:bid/columns`、POST `/boards/:bid/columns`、PATCH `/boards/:bid/columns/:cid`、DELETE `/boards/:bid/columns/:cid`；
- POST `/boards/:bid/move`（批量移动/排序，幂等）。

### 6. 迭代与版本
- GET/POST `/projects/:id/sprints`，GET/PATCH `/sprints/:sid`，POST `/sprints/:sid/complete`；
- GET/POST `/projects/:id/releases`，GET/PATCH `/releases/:rid`，POST `/releases/:rid/publish`。

### 7. 文档与搜索（字段级）
- GET/POST `/projects/:id/docs`、GET `/docs/:did`、PATCH `/docs/:did`、GET `/docs/:did/history`；
- GET `/search`（跨实体）。

### 8. 通知与自动化
- GET/POST `/projects/:id/rules`、PATCH `/rules/:rid`、DELETE `/rules/:rid`；
- Webhook 入站：`/integrations/:provider/webhook`（Git/CI/IM）。

### 9. 字段校验与 MySQL 约束/索引建议
- 唯一：`projects.key`、`labels(project_id, name)`、`webhooks(project_id, url)`
- 外键：`issues.project_id`→`projects.id`（ON DELETE CASCADE），`comments.issue_id`→`issues.id`
- 索引：
  - `issues(project_id, state, assignee_id, updated_at desc)`
  - `comments(issue_id, created_at)`
  - `sprints(project_id, start_at, end_at)`
  - `releases(project_id, released_at)`
- 文本：`issues.title`、`issues.description`、`comments.body` 使用全文索引（MySQL 8 InnoDB `FULLTEXT`）

### 10. 响应示例
```json
{
  "code": 0,
  "message": "OK",
  "data": { "id": "ISSUE-1", "title": "支持看板拖拽" },
  "requestId": "b3a2f..."
}
```


