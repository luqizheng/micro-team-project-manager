# Issues PUT方法实现说明

## 概述

为Issues控制器添加了PUT方法，用于完整更新Issue内容。PUT方法遵循RESTful API设计原则，提供完整的资源替换功能。

## 功能特性

### 1. PUT方法特点
- **完整更新**：需要提供所有必需字段
- **资源替换**：完全替换现有Issue内容
- **字段验证**：严格的字段类型和格式验证
- **业务逻辑**：包含工时字段的特殊处理逻辑

### 2. 支持的字段

#### 必需字段
- `type`: Issue类型（requirement/task/bug）
- `title`: Issue标题（1-140字符）
- `state`: Issue状态

#### 可选字段
- `description`: 详细描述
- `priority`: 优先级
- `severity`: 严重程度
- `reporterId`: 报告人ID
- `assigneeId`: 负责人ID
- `storyPoints`: 故事点数
- `estimateMinutes`: 预估分钟数
- `remainingMinutes`: 剩余分钟数
- `estimatedHours`: 预估工时（最多1位小数）
- `actualHours`: 实际工时（最多1位小数）
- `sprintId`: 迭代ID
- `releaseId`: 发布ID
- `parentId`: 父Issue ID
- `labels`: 标签数组
- `dueAt`: 截止日期（ISO 8601格式）

## 技术实现

### 1. DTO定义

```typescript
class PutIssueDto {
  @IsEnum(IssueType)
  type!: IssueType;

  @IsString()
  @Length(1, 140)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  state!: string;

  // ... 其他可选字段
}
```

### 2. 控制器方法

```typescript
@Put(':id')
@UseGuards(RolesGuard)
@Roles('member', 'project_manager')
put(@Param('id') id: string, @Body() body: PutIssueDto) {
  // 工时字段验证
  if (body.type === 'task') {
    if (body.estimatedHours != null && !/^\d{1,3}(\.\d)?$/.test(String(body.estimatedHours))) {
      throw new Error('estimatedHours must be a number with 1 decimal at most');
    }
    if (body.actualHours != null && !/^\d{1,3}(\.\d)?$/.test(String(body.actualHours))) {
      throw new Error('actualHours must be a number with 1 decimal at most');
    }
  } else {
    body.estimatedHours = null;
    body.actualHours = null;
  }

  // 日期转换
  const updateData: any = { ...body };
  if (body.dueAt) {
    updateData.dueAt = new Date(body.dueAt);
  }

  return this.service.update(id, updateData);
}
```

### 3. 权限控制
- 需要JWT认证
- 需要`member`或`project_manager`角色
- 使用`RolesGuard`进行权限验证

## API使用

### 1. 请求格式

```http
PUT /projects/{projectId}/issues/{issueId}
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "type": "task",
  "title": "更新后的Issue标题",
  "description": "详细描述内容",
  "state": "in_progress",
  "priority": "high",
  "severity": "medium",
  "assigneeId": "user-uuid",
  "reporterId": "user-uuid",
  "storyPoints": 8,
  "estimatedHours": 12.5,
  "actualHours": 3.0,
  "labels": ["bug", "urgent"],
  "dueAt": "2024-12-31T23:59:59.000Z"
}
```

### 2. 响应格式

```json
{
  "id": "issue-uuid",
  "type": "task",
  "title": "更新后的Issue标题",
  "description": "详细描述内容",
  "state": "in_progress",
  "priority": "high",
  "severity": "medium",
  "assigneeId": "user-uuid",
  "reporterId": "user-uuid",
  "storyPoints": 8,
  "estimatedHours": 12.5,
  "actualHours": 3.0,
  "labels": ["bug", "urgent"],
  "dueAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

## 业务逻辑

### 1. 工时字段处理
- 只有`task`类型的Issue可以设置工时字段
- 其他类型的Issue会自动将工时字段设置为`null`
- 工时字段支持最多1位小数

### 2. 日期处理
- `dueAt`字段自动转换为Date对象
- 支持ISO 8601格式的日期字符串

### 3. 字段验证
- 使用`class-validator`进行字段验证
- 严格的类型检查和长度限制
- UUID格式验证

## 与PATCH方法的区别

| 特性 | PUT方法 | PATCH方法 |
|------|---------|-----------|
| 更新方式 | 完整替换 | 部分更新 |
| 必需字段 | 所有必需字段 | 只需要更新的字段 |
| 字段支持 | 所有Issue字段 | 部分字段 |
| 使用场景 | 完整编辑 | 快速更新 |

## 错误处理

### 1. 验证错误
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 2. 权限错误
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 3. 资源不存在
```json
{
  "statusCode": 404,
  "message": "Issue not found"
}
```

## 测试

### 1. 测试脚本
使用提供的PowerShell测试脚本：
```powershell
.\scripts\test-issues-put-api.ps1
```

### 2. 测试用例
- 正常PUT请求
- 字段验证测试
- 权限验证测试
- 工时字段业务逻辑测试
- 日期格式转换测试

## 使用示例

### 1. 完整更新Issue
```javascript
const response = await fetch('/projects/project-id/issues/issue-id', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    type: 'task',
    title: '新的Issue标题',
    description: '详细描述',
    state: 'in_progress',
    priority: 'high',
    estimatedHours: 8.5,
    labels: ['urgent', 'feature']
  })
});
```

### 2. 前端集成
```typescript
// 在Vue组件中使用
async function updateIssue(issueId: string, data: PutIssueDto) {
  try {
    const response = await http.put(`/projects/${projectId}/issues/${issueId}`, data);
    message.success('Issue更新成功');
    return response.data;
  } catch (error) {
    message.error('更新失败');
    throw error;
  }
}
```

## 总结

PUT方法的实现提供了：

✅ **完整的Issue更新功能**
✅ **严格的字段验证**
✅ **业务逻辑处理**
✅ **权限控制**
✅ **错误处理**
✅ **RESTful API设计**

该实现遵循了RESTful API的最佳实践，为前端提供了完整的Issue编辑功能，同时保持了数据的一致性和安全性。
