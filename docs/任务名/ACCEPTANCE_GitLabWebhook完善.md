ACCEPTANCE_GitLabWebhook完善

- 用例 1：通用入口成功
  - 前置：已创建启用的 GitLab 实例，配置 `webhookSecret` 为 `secret1`。
  - 请求：`POST /gitlab/webhook?instanceId=<实例ID>`
    - 头：`X-Gitlab-Event: Push Hook`（或实际事件类型），`X-Gitlab-Token: secret1`
    - 体：原始 GitLab 事件（含 `object_kind`, `project`, `user`）。
  - 期望：返回 200，`success=true`；数据库 `gitlab_event_logs` 新增记录，`eventType=push`（或对应类型），`processed=true`。

- 用例 2：Token 错误
  - 修改请求头：`X-Gitlab-Token: wrong`。
  - 期望：返回 401。

- 用例 3：缺少 instanceId
  - 去掉 query `instanceId`。
  - 期望：返回 400。

- 用例 4：缺少必要字段
  - 体为 `{}`。
  - 期望：返回 400。

- 用例 5：分发骨架事件（示例 tag_push、release、wiki_page、deployment、job）
  - 分别提交对应 `object_kind` 的原始事件。
  - 期望：均返回 200 且写入 `gitlab_event_logs`，`processed=true`。

- 备注：后续版本将为各事件补充实际业务处理与去重幂等逻辑。

