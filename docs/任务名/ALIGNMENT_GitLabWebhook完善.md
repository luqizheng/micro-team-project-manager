# ALIGNMENT_GitLabWebhook完善

## 原始需求
- 核对并完善 GitLab Webhook：事件覆盖、鉴权校验、解析与分发、日志/落库最小闭环。

## 项目上下文理解
- 后端基于 NestJS + TypeORM，模块：`server/src/modules/gitlab-integration`。
- 已有控制器：`presentation/controllers/gitlab-webhook.controller.ts` 提供通用与分路由入口。
- 已有服务：`services/gitlab-webhook.service.ts` 提供解析/基础校验，但未完成具体分发与持久化。
- `GitLabIntegrationModule` 已注册 `GitLabInstance`、`GitLabEventLog` 等实体。

## 范围与边界
- 本轮最小闭环：
  - 修正通用入口的 payload 解析为原始 GitLab 事件对象。
  - 实现基于 `instanceId` 与 `X-Gitlab-Token` 的明文等值校验（符合 GitLab 规范）。
  - 调用服务的 `processWebhookEvent`，达到“可接收-可鉴权-可返回”的闭环。
- 暂不实现：
  - 各事件的业务落地（同步 Issue/MR、写 `GitLabEventLog` 等）细节；
  - 完整事件全覆盖（tag_push、release、job、wiki_page、deployment 等）的业务分发与测试。

## 事件清单（现状）
- 已有路由：push、issue、merge_request、pipeline、note（分路由）与通用入口。
- 类型中引用但未覆盖的处理：`wiki_page`、`deployment` 等。

## 技术约束与一致性
- 鉴权：GitLab Webhook 使用 `X-Gitlab-Token`，与实例 `webhookSecret` 明文等值比较。
- 解析：`parseWebhookEvent` 需要原始 payload（包含 `object_kind`、`project` 等）。
- 返回：统一返回 { success, message }，错误时抛出 400/401 等。

## 验收标准
- 通用入口：提供 `instanceId`、`X-Gitlab-Event`、`X-Gitlab-Token` 与原始事件体时：
  - Token 正确：返回 200 且消息包含事件类型；
  - Token 错误：返回 401；
  - 缺少必要头/参数：返回 400。
- 分路由复用通用逻辑，行为一致。

## 疑问澄清（待确认）
1. 是否需要同时支持系统级 Hook（不绑定实例）？
2. 实例 `instanceId` 采用何种标识（UUID/自增）与路由方案（query vs path）更适配现有前端？
3. 事件落库的最小字段集与幂等策略是否已有现成约定？

## 决策与后续
- 先完成最小闭环与鉴权规范化；
- 下个迭代补齐缺失事件的分发骨架与 `GitLabEventLog` 落库；
- 再下个迭代接入增量同步与去重队列。


