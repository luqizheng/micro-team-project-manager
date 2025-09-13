# GitLab集成功能 API文档

## 概述

GitLab集成功能提供了完整的GitLab实例管理、项目映射、数据同步、事件处理和权限管理功能。本文档详细描述了所有可用的API端点。

## 基础信息

- **基础URL**: `/api`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`
- **字符编码**: UTF-8

## 认证

所有API请求都需要在请求头中包含有效的JWT令牌：

```http
Authorization: Bearer <your-jwt-token>
```

## 响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

## 错误处理

错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "statusCode": 400
}
```

## API端点

### 1. GitLab实例管理

#### 1.1 创建GitLab实例

```http
POST /gitlab/instances
```

**请求体**:
```json
{
  "name": "My GitLab Instance",
  "url": "https://gitlab.example.com",
  "accessToken": "glpat-xxxxxxxxxxxxxxxxxxxx",
  "type": "self_hosted",
  "description": "内部GitLab实例",
  "webhookSecret": "webhook-secret-key",
  "syncConfig": {
    "syncUsers": true,
    "syncIssues": true,
    "syncMergeRequests": true,
    "syncPipelines": true
  },
  "advancedConfig": {
    "apiTimeout": 30,
    "retryCount": 3
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "GitLab实例创建成功",
  "data": {
    "id": "inst-123",
    "name": "My GitLab Instance",
    "url": "https://gitlab.example.com",
    "type": "self_hosted",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 1.2 获取所有GitLab实例

```http
GET /gitlab/instances
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认10
- `search` (可选): 搜索关键词
- `type` (可选): 实例类型筛选
- `isActive` (可选): 状态筛选

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "inst-123",
      "name": "My GitLab Instance",
      "url": "https://gitlab.example.com",
      "type": "self_hosted",
      "isActive": true,
      "lastSyncAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

#### 1.3 获取特定GitLab实例

```http
GET /gitlab/instances/{id}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "inst-123",
    "name": "My GitLab Instance",
    "url": "https://gitlab.example.com",
    "type": "self_hosted",
    "isActive": true,
    "description": "内部GitLab实例",
    "syncConfig": {
      "syncUsers": true,
      "syncIssues": true,
      "syncMergeRequests": true,
      "syncPipelines": true
    },
    "advancedConfig": {
      "apiTimeout": 30,
      "retryCount": 3
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 1.4 更新GitLab实例

```http
PUT /gitlab/instances/{id}
```

**请求体**:
```json
{
  "name": "Updated GitLab Instance",
  "description": "更新的描述",
  "syncConfig": {
    "syncUsers": false,
    "syncIssues": true,
    "syncMergeRequests": true,
    "syncPipelines": false
  }
}
```

#### 1.5 删除GitLab实例

```http
DELETE /gitlab/instances/{id}
```

#### 1.6 测试GitLab实例连接

```http
POST /gitlab/instances/{id}/test
```

**响应**:
```json
{
  "success": true,
  "message": "连接测试成功",
  "data": {
    "isConnected": true,
    "responseTime": 150,
    "version": "15.0.0"
  }
}
```

#### 1.7 获取GitLab实例项目列表

```http
GET /gitlab/instances/{id}/projects
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认100
- `search` (可选): 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "test-project",
      "name_with_namespace": "group/test-project",
      "description": "项目描述",
      "web_url": "https://gitlab.example.com/group/test-project",
      "created_at": "2024-01-01T00:00:00Z",
      "last_activity_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### 2. 项目映射管理

#### 2.1 创建项目映射

```http
POST /gitlab/projects/{projectId}/mappings
```

**请求体**:
```json
{
  "gitlabInstanceId": "inst-123",
  "gitlabProjectId": "456",
  "gitlabProjectPath": "group/test-project",
  "syncConfig": {
    "syncIssues": true,
    "syncMergeRequests": true,
    "syncPipelines": true,
    "syncCommits": true
  },
  "fieldMapping": {
    "title": "title",
    "description": "description",
    "assignee": "assignee",
    "labels": "labels"
  },
  "description": "项目映射描述"
}
```

#### 2.2 获取项目映射列表

```http
GET /gitlab/projects/{projectId}/mappings
```

**查询参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认10
- `gitlabInstanceId` (可选): GitLab实例ID筛选
- `isActive` (可选): 状态筛选

#### 2.3 获取特定项目映射

```http
GET /gitlab/projects/{projectId}/mappings/{mappingId}
```

#### 2.4 更新项目映射

```http
PUT /gitlab/projects/{projectId}/mappings/{mappingId}
```

#### 2.5 删除项目映射

```http
DELETE /gitlab/projects/{projectId}/mappings/{mappingId}
```

#### 2.6 同步项目映射

```http
POST /gitlab/projects/{projectId}/mappings/{mappingId}/sync
```

**响应**:
```json
{
  "success": true,
  "message": "项目映射同步成功",
  "data": {
    "syncId": "sync-123",
    "status": "running",
    "startedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3. 同步管理

#### 3.1 执行增量同步

```http
POST /gitlab/sync/incremental/{instanceId}
```

**请求体**:
```json
{
  "projectId": "proj-123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "增量同步已启动",
  "syncCount": 25,
  "lastSyncAt": "2024-01-01T12:00:00Z"
}
```

#### 3.2 执行全量同步

```http
POST /gitlab/sync/full/{instanceId}
```

#### 3.3 执行补偿同步

```http
POST /gitlab/sync/compensation/{instanceId}
```

#### 3.4 同步GitLab用户

```http
POST /gitlab/sync/users/{instanceId}
```

**响应**:
```json
{
  "success": true,
  "message": "用户同步已启动",
  "syncedCount": 50,
  "lastSyncAt": "2024-01-01T12:00:00Z"
}
```

#### 3.5 获取用户映射统计

```http
GET /gitlab/sync/users/{instanceId}/statistics
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "mappedUsers": 95,
    "unmappedUsers": 5,
    "lastSyncAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 3.6 清理无效用户映射

```http
POST /gitlab/sync/users/{instanceId}/cleanup
```

### 4. 事件管理

#### 4.1 获取事件统计

```http
GET /gitlab/sync/events/statistics
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalEvents": 1000,
    "successfulEvents": 950,
    "failedEvents": 50,
    "processingEvents": 0,
    "todayEvents": 100,
    "successRate": 95.0
  }
}
```

#### 4.2 重试事件

```http
POST /gitlab/sync/events/{eventId}/retry
```

#### 4.3 批量重试事件

```http
POST /gitlab/sync/events/batch-retry
```

**请求体**:
```json
{
  "eventIds": ["event-1", "event-2", "event-3"]
}
```

#### 4.4 获取事件健康状态

```http
GET /gitlab/sync/events/health
```

**响应**:
```json
{
  "success": true,
  "data": {
    "isHealthy": true,
    "totalEvents": 1000,
    "failedEvents": 50,
    "successRate": 95.0,
    "lastProcessedAt": "2024-01-01T12:00:00Z",
    "queueSize": 0
  }
}
```

### 5. 权限管理

#### 5.1 检查用户权限

```http
POST /gitlab/permissions/check
```

**请求体**:
```json
{
  "permission": "read:gitlab_instance",
  "instanceId": "inst-123",
  "projectId": "proj-123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permission": "read:gitlab_instance",
    "message": "权限验证通过"
  }
}
```

#### 5.2 获取用户权限摘要

```http
GET /gitlab/permissions/user/{userId}/summary
```

**响应**:
```json
{
  "success": true,
  "data": {
    "role": "system_admin",
    "permissions": [
      "read:gitlab_instance",
      "create:gitlab_instance",
      "update:gitlab_instance",
      "delete:gitlab_instance"
    ],
    "accessibleInstances": 5,
    "accessibleMappings": 20,
    "canSync": true
  }
}
```

#### 5.3 获取当前用户权限摘要

```http
GET /gitlab/permissions/my/summary
```

#### 5.4 获取权限配置

```http
GET /gitlab/permissions/config
```

**响应**:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "enableFineGrained": false,
    "defaultPolicy": "deny",
    "cacheTimeout": 300
  }
}
```

#### 5.5 更新权限配置

```http
PUT /gitlab/permissions/config
```

**请求体**:
```json
{
  "enabled": true,
  "enableFineGrained": true,
  "defaultPolicy": "deny",
  "cacheTimeout": 600
}
```

### 6. 统计和监控

#### 6.1 获取整体统计

```http
GET /gitlab/statistics
```

**响应**:
```json
{
  "success": true,
  "data": {
    "instances": 5,
    "mappings": 20,
    "syncTasks": 100,
    "events": 1000,
    "users": 50,
    "lastSyncAt": "2024-01-01T12:00:00Z"
  }
}
```

### 7. Webhook接收

#### 7.1 接收GitLab Webhook事件

```http
POST /gitlab/webhook/{instanceId}
```

**请求头**:
```
X-Gitlab-Token: webhook-secret-key
X-Gitlab-Event: push
Content-Type: application/json
```

**请求体** (Push事件示例):
```json
{
  "object_kind": "push",
  "project": {
    "id": 456,
    "name": "test-project",
    "path_with_namespace": "group/test-project",
    "web_url": "https://gitlab.example.com/group/test-project"
  },
  "commits": [
    {
      "id": "abc123",
      "message": "Add new feature",
      "author": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "ref": "refs/heads/main",
  "before": "def456",
  "after": "abc123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "Webhook事件处理成功",
  "eventId": "event-123"
}
```

## 错误代码

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权访问 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 数据验证失败 |
| 500 | Internal Server Error | 服务器内部错误 |

## 限流

API请求受到以下限制：

- **认证请求**: 每分钟最多60次
- **一般请求**: 每分钟最多300次
- **同步请求**: 每分钟最多10次
- **Webhook请求**: 每分钟最多1000次

超出限制时返回429状态码。

## 版本控制

API版本通过URL路径控制：

- 当前版本: v1 (默认)
- 版本格式: `/api/v1/gitlab/...`

## 示例代码

### JavaScript/TypeScript

```javascript
// 创建GitLab实例
const response = await fetch('/api/gitlab/instances', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'My GitLab Instance',
    url: 'https://gitlab.example.com',
    accessToken: 'glpat-xxxxxxxxxxxxxxxxxxxx',
    type: 'self_hosted'
  })
});

const result = await response.json();
console.log(result);
```

### cURL

```bash
# 获取所有GitLab实例
curl -X GET "https://api.example.com/gitlab/instances" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"

# 创建项目映射
curl -X POST "https://api.example.com/gitlab/projects/proj-123/mappings" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "gitlabInstanceId": "inst-123",
    "gitlabProjectId": "456",
    "gitlabProjectPath": "group/test-project"
  }'
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持GitLab实例管理
- 支持项目映射管理
- 支持数据同步功能
- 支持事件处理
- 支持权限管理
