# GitLab Issue自动创建功能

## 功能概述

当本地Issue在GitLab中不存在时，系统现在会自动在GitLab中创建对应的Issue，而不是简单地跳过同步。

## 问题背景

在之前的实现中，`updateIssueInGitLab` 方法存在以下问题：

1. **只尝试更新**：只尝试更新GitLab中已存在的Issue
2. **跳过创建**：如果GitLab中没有对应的Issue，会直接跳过同步
3. **数据不一致**：导致本地和GitLab之间的数据不同步

## 解决方案

### 1. 智能检测机制

系统现在会智能检测以下情况：

- **新本地Issue**：如果Issue Key中没有GitLab IID，说明是新的本地Issue
- **GitLab Issue不存在**：如果GitLab中找不到对应的Issue（404错误）
- **正常更新**：如果GitLab Issue存在，则正常更新

### 2. 自动创建逻辑

当检测到需要创建新Issue时，系统会：

1. 准备Issue数据（标题、描述、标签、负责人等）
2. 调用GitLab API创建Issue
3. 更新本地Issue的Key，包含新创建的GitLab IID
4. 记录详细的操作日志

### 3. 代码实现

#### 主要方法

```typescript
/**
 * 在GitLab中更新或创建Issue
 */
private async updateIssueInGitLab(
  instance: GitLabInstance,
  mapping: GitLabProjectMapping,
  issue: IssueEntity,
  originalData?: Partial<IssueEntity>
): Promise<void> {
  // 1. 检查是否有实际变更
  if (originalData && !this.hasSignificantChanges(issue, originalData)) {
    return;
  }

  // 2. 提取GitLab Issue IID
  const gitlabIssueIid = this.extractGitLabIssueIid(issue.key);
  
  // 3. 如果没有IID，创建新Issue
  if (!gitlabIssueIid) {
    await this.createIssueInGitLab(instance, mapping, issue);
    return;
  }

  // 4. 检查GitLab Issue是否存在
  try {
    await this.gitlabApiService.getIssue(instance, mapping.gitlabProjectId, gitlabIssueIid);
  } catch (error) {
    // 5. 如果不存在，创建新Issue
    if (error.status === 404) {
      await this.createIssueInGitLab(instance, mapping, issue);
      return;
    }
    throw error;
  }

  // 6. 正常更新逻辑...
}
```

#### 创建Issue方法

```typescript
/**
 * 在GitLab中创建Issue
 */
private async createIssueInGitLab(
  instance: GitLabInstance,
  mapping: GitLabProjectMapping,
  issue: IssueEntity
): Promise<void> {
  // 1. 准备创建数据
  const createData = {
    title: issue.title,
    description: issue.description || '',
    assigneeIds: await this.getGitLabAssigneeIds(instance, issue.assigneeId),
    labels: this.buildGitLabLabels(issue),
  };

  // 2. 在GitLab中创建Issue
  const gitlabIssue = await this.gitlabApiService.createIssue(
    instance,
    mapping.gitlabProjectId,
    createData.title,
    createData.description,
    createData.assigneeIds,
    createData.labels
  );

  // 3. 更新本地Issue的Key
  const newIssueKey = `${mapping.project?.key || 'PROJ'}-${gitlabIssue.iid}`;
  await this.repo.update(issue.id, { key: newIssueKey });
}
```

## 使用场景

### 1. 新创建的本地Issue

当用户在本地创建新Issue时：
- 系统检测到Issue Key中没有GitLab IID
- 自动在GitLab中创建对应的Issue
- 更新本地Issue Key包含GitLab IID

### 2. GitLab Issue被删除

如果GitLab中的Issue被意外删除：
- 系统检测到404错误
- 自动重新创建Issue
- 保持数据同步

### 3. 数据恢复

在数据恢复或迁移场景中：
- 本地有Issue但GitLab中没有
- 系统会自动创建缺失的Issue
- 确保数据完整性

## 测试方法

使用提供的测试脚本：

```powershell
.\test-gitlab-issue-creation.ps1
```

测试步骤：
1. 创建本地Issue（没有GitLab IID）
2. 更新Issue触发同步
3. 验证GitLab中是否创建了新Issue
4. 检查Issue Key是否包含GitLab IID

## 日志记录

系统会记录详细的操作日志：

- **创建成功**：记录GitLab Issue IID和本地Issue信息
- **创建失败**：记录错误信息和上下文
- **Key更新**：记录旧的Key和新的Key

## 注意事项

1. **权限要求**：确保GitLab API Token有创建Issue的权限
2. **项目映射**：确保本地项目已正确映射到GitLab项目
3. **网络连接**：确保系统能正常访问GitLab实例
4. **错误处理**：创建失败时会抛出异常，需要适当的错误处理

## 相关文件

- `server/src/modules/issues/issues.service.ts` - 主要实现
- `server/src/modules/gitlab-integration/services/gitlab-api-gitbeaker.service.ts` - GitLab API服务
- `test-gitlab-issue-creation.ps1` - 测试脚本
