# GitLab集成功能 - 共识阶段

## 明确的需求描述

### 核心功能
1. **GitLab Self-hosted集成**
   - 支持多个GitLab自托管实例连接
   - 优先实现System Hooks（系统级webhook）
   - 支持push、merge request、issue、pipeline事件监听
   - 将GitLab事件同步到项目管理工具

2. **权限控制**
   - 集成管理界面：仅System Admin可访问
   - GitLab.com项目级配置：Project Admin和System Admin可访问
   - 支持多实例管理

3. **事件同步**
   - GitLab Issue → 项目管理工具Issue
   - GitLab Merge Request → 项目管理工具Issue
   - GitLab Pipeline状态 → 项目管理工具任务状态
   - GitLab Push事件 → 基于commit message更新任务状态

## 技术实现方案

### 1. 数据库设计扩展

#### 新增表结构
```sql
-- GitLab实例配置表
CREATE TABLE gitlab_instances (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  api_token VARCHAR(500) NOT NULL,
  webhook_secret VARCHAR(128),
  is_active BOOLEAN DEFAULT TRUE,
  instance_type ENUM('self_hosted', 'gitlab_com') DEFAULT 'self_hosted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- GitLab项目映射表
CREATE TABLE gitlab_project_mappings (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  gitlab_instance_id VARCHAR(36) NOT NULL,
  gitlab_project_id INT NOT NULL,
  gitlab_project_path VARCHAR(500) NOT NULL,
  webhook_id VARCHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (gitlab_instance_id) REFERENCES gitlab_instances(id) ON DELETE CASCADE,
  UNIQUE KEY unique_mapping (project_id, gitlab_instance_id, gitlab_project_id)
);

-- GitLab事件日志表
CREATE TABLE gitlab_event_logs (
  id VARCHAR(36) PRIMARY KEY,
  gitlab_instance_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gitlab_instance_id) REFERENCES gitlab_instances(id) ON DELETE CASCADE
);
```

### 2. 技术架构设计

#### 核心模块结构
```
src/modules/gitlab-integration/
├── gitlab-integration.module.ts
├── gitlab-integration.service.ts
├── gitlab-integration.controller.ts
├── entities/
│   ├── gitlab-instance.entity.ts
│   ├── gitlab-project-mapping.entity.ts
│   └── gitlab-event-log.entity.ts
├── services/
│   ├── gitlab-api.service.ts
│   ├── gitlab-webhook.service.ts
│   └── gitlab-sync.service.ts
├── controllers/
│   ├── gitlab-instances.controller.ts
│   └── gitlab-project-mappings.controller.ts
└── dto/
    ├── create-gitlab-instance.dto.ts
    ├── update-gitlab-instance.dto.ts
    └── create-project-mapping.dto.ts
```

### 3. API设计

#### GitLab实例管理API
```typescript
// 仅System Admin可访问
GET    /api/v1/gitlab/instances              // 获取所有GitLab实例
POST   /api/v1/gitlab/instances              // 创建GitLab实例
GET    /api/v1/gitlab/instances/:id          // 获取特定实例
PUT    /api/v1/gitlab/instances/:id          // 更新实例配置
DELETE /api/v1/gitlab/instances/:id          // 删除实例
POST   /api/v1/gitlab/instances/:id/test     // 测试连接
```

#### 项目映射管理API
```typescript
// Project Admin和System Admin可访问
GET    /api/v1/projects/:projectId/gitlab/mappings     // 获取项目映射
POST   /api/v1/projects/:projectId/gitlab/mappings     // 创建项目映射
DELETE /api/v1/projects/:projectId/gitlab/mappings/:id // 删除映射
POST   /api/v1/projects/:projectId/gitlab/sync         // 手动同步
```

#### Webhook接收API
```typescript
POST   /api/v1/gitlab/webhook/:instanceId    // 接收GitLab webhook
```

### 4. 事件映射规则

#### System Hooks事件处理
```typescript
// 事件类型映射
const EVENT_MAPPINGS = {
  'push': 'handlePushEvent',
  'merge_request': 'handleMergeRequestEvent', 
  'issue': 'handleIssueEvent',
  'pipeline': 'handlePipelineEvent'
};

// 处理逻辑
- push: 解析commit message中的任务引用，更新任务状态
- merge_request: 创建或更新相关任务，同步状态
- issue: 同步GitLab Issue到项目管理工具
- pipeline: 根据pipeline状态更新相关任务
```

### 5. 安全机制

#### 认证与授权
- GitLab API Token加密存储
- Webhook签名验证（HMAC-SHA256）
- 基于角色的访问控制
- IP白名单支持

#### 数据安全
- 敏感信息加密存储
- API调用日志记录
- 错误处理和重试机制
- 事件去重和幂等性保证

## 技术约束

### 1. 现有系统集成
- 必须与现有NestJS架构兼容
- 使用现有TypeORM实体系统
- 遵循现有权限和安全机制
- 集成现有Webhook验签机制

### 2. 性能要求
- 支持高并发Webhook处理
- 异步事件处理机制
- 合理的API调用频率限制
- 数据库查询优化

### 3. 可扩展性
- 支持多GitLab实例
- 预留Gitee和GitHub扩展接口
- 模块化设计便于维护
- 配置化管理

## 验收标准

### 1. 功能验收
- [ ] 能够添加和管理多个GitLab自托管实例
- [ ] 能够配置项目与GitLab项目的映射关系
- [ ] 能够接收和处理System Hooks事件
- [ ] 能够将GitLab事件同步到项目管理工具
- [ ] 提供完整的集成管理界面

### 2. 安全验收
- [ ] 敏感信息加密存储
- [ ] Webhook签名验证正确
- [ ] 权限控制有效
- [ ] 无安全漏洞

### 3. 性能验收
- [ ] 支持并发Webhook处理
- [ ] API响应时间合理
- [ ] 数据库查询优化
- [ ] 错误处理完善

### 4. 用户体验验收
- [ ] 管理界面直观易用
- [ ] 错误信息清晰明确
- [ ] 操作流程顺畅
- [ ] 文档完整

## 任务边界限制

### 包含范围
- GitLab Self-hosted实例管理
- System Hooks事件处理
- 基础的项目和用户同步
- 事件映射和状态同步
- 集成管理界面
- 安全机制和权限控制

### 不包含范围
- Gitee和GitHub集成（后续实现）
- GitLab.com的Project Hooks（后续实现）
- 复杂的CI/CD集成
- 代码审查集成
- 高级自动化规则

## 确认所有不确定性已解决

✅ GitLab连接方式：Personal Access Token + 多实例支持
✅ Hooks类型：优先System Hooks，后续支持Project Hooks
✅ 事件类型：push、merge request、issue、pipeline
✅ 数据同步：GitLab Issue同步到项目管理工具
✅ 权限控制：集成管理仅Admin，项目配置Admin和Project Admin
✅ 技术架构：基于现有NestJS架构扩展
✅ 安全机制：加密存储、签名验证、权限控制

所有关键决策点已确认，可以进入DESIGN阶段。
