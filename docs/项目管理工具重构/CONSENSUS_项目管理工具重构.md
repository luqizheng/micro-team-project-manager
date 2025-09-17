# 项目管理工具重构 - 共识阶段

## 明确的需求描述

### 核心功能重构
1. **数据模型重构**
   - 从单一Issue表重构为多个独立实体：Requirement、Subsystem、FeatureModule、Task、Bug
   - 支持层级关系：需求 → 子系统 → 功能模块 → 任务/缺陷
   - 保持数据完整性和迁移兼容性

2. **GitLab集成扩展**
   - 扩展现有GitLab集成支持Epic级别同步
   - 需求/功能模块/子系统 → GitLab Epic
   - 任务/缺陷 → GitLab Issue（保持现有功能）
   - 维护层级关系在GitLab中的映射

3. **API设计优化**
   - 设计新的层级结构API
   - 保持现有Issue API的向后兼容性
   - 支持渐进式前端迁移

## 技术实现方案

### 1. 数据模型重构策略

#### 采用渐进式重构方案
- **阶段1**：新增独立实体，保持现有Issue表
- **阶段2**：实现数据迁移和映射
- **阶段3**：逐步废弃Issue表，完全使用新实体

#### 新实体设计
```typescript
// 需求实体
@Entity('requirements')
export class RequirementEntity {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  state: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  labels?: string[];
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

// 子系统实体
@Entity('subsystems')
export class SubsystemEntity {
  id: string;
  projectId: string;
  requirementId?: string; // 可选，支持直接属于项目
  title: string;
  description?: string;
  state: string;
  assigneeId?: string;
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

// 功能模块实体
@Entity('feature_modules')
export class FeatureModuleEntity {
  id: string;
  projectId: string;
  requirementId?: string;
  subsystemId?: string;
  title: string;
  description?: string;
  state: string;
  assigneeId?: string;
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

// 任务实体
@Entity('tasks')
export class TaskEntity {
  id: string;
  projectId: string;
  requirementId?: string;
  subsystemId?: string;
  featureModuleId?: string;
  title: string;
  description?: string;
  state: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  estimateMinutes?: number;
  remainingMinutes?: number;
  estimatedHours?: number;
  actualHours?: number;
  sprintId?: string;
  releaseId?: string;
  parentId?: string;
  labels?: string[];
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

// 缺陷实体
@Entity('bugs')
export class BugEntity {
  id: string;
  projectId: string;
  subsystemId?: string;
  featureModuleId?: string;
  title: string;
  description?: string;
  state: string;
  priority?: string;
  severity?: string;
  assigneeId?: string;
  reporterId?: string;
  labels?: string[];
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}
```

### 2. GitLab集成扩展

#### 新增GitLab Epic映射表
```typescript
@Entity('gitlab_epic_mappings')
export class GitLabEpicMapping {
  id: string;
  projectId: string;
  gitlabInstanceId: string;
  gitlabGroupId: number;
  gitlabEpicId: number;
  entityType: 'requirement' | 'subsystem' | 'feature_module';
  entityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 扩展GitLab API服务
- 新增Epic相关API调用方法
- 支持Epic的创建、更新、删除操作
- 维护Epic与Issue的关联关系

### 3. API设计策略

#### 保持向后兼容性
- 现有Issue API继续工作
- 通过适配器模式将Issue API映射到新实体
- 逐步引入新的层级结构API

#### 新API设计
```typescript
// 层级结构API
GET    /api/v1/projects/:projectId/requirements
POST   /api/v1/projects/:projectId/requirements
GET    /api/v1/projects/:projectId/subsystems
POST   /api/v1/projects/:projectId/subsystems
GET    /api/v1/projects/:projectId/feature-modules
POST   /api/v1/projects/:projectId/feature-modules
GET    /api/v1/projects/:projectId/tasks
POST   /api/v1/projects/:projectId/tasks
GET    /api/v1/projects/:projectId/bugs
POST   /api/v1/projects/:projectId/bugs

// 层级关系API
GET    /api/v1/projects/:projectId/hierarchy
POST   /api/v1/projects/:projectId/hierarchy/move
```

### 4. 前端重构策略

#### 渐进式组件迁移
- 保持现有Issue相关组件正常工作
- 逐步创建新的层级结构组件
- 使用适配器模式连接新旧组件

#### 新组件设计
- RequirementManager：需求管理组件
- SubsystemManager：子系统管理组件
- FeatureModuleManager：功能模块管理组件
- TaskManager：任务管理组件
- BugManager：缺陷管理组件
- HierarchyView：层级结构视图组件

## 技术约束

### 1. 现有系统集成
- 必须与现有NestJS架构兼容
- 使用现有TypeORM实体系统
- 保持现有GitLab集成功能
- 遵循现有权限和安全机制

### 2. 数据迁移要求
- 支持现有数据无损迁移
- 保持父子关系的完整性
- 支持回滚机制
- 提供迁移进度监控

### 3. 性能要求
- 保持现有API响应时间
- 支持大量层级数据的查询
- 优化层级关系查询性能
- 支持分页和筛选

### 4. 可扩展性
- 支持未来新增工作项类型
- 支持自定义层级关系
- 支持灵活的权限控制
- 支持插件化扩展

## 验收标准

### 1. 功能验收
- [ ] 支持需求-子系统-功能模块-任务/缺陷的层级结构
- [ ] 支持层级间的依赖关系跟踪
- [ ] 支持跨层级的状态汇总和进度统计
- [ ] GitLab Epic级别同步正常工作
- [ ] 现有Issue API保持兼容性

### 2. 数据迁移验收
- [ ] 现有数据完整迁移到新实体
- [ ] 父子关系正确映射
- [ ] 数据完整性验证通过
- [ ] 迁移过程可监控和回滚

### 3. 性能验收
- [ ] API响应时间不超过现有水平
- [ ] 层级查询性能满足要求
- [ ] 支持大量数据的处理
- [ ] 内存使用合理

### 4. 用户体验验收
- [ ] 现有功能正常工作
- [ ] 新层级结构界面直观易用
- [ ] 数据迁移过程透明
- [ ] 错误处理完善

## 任务边界限制

### 包含范围
- 数据模型重构和实体设计
- GitLab集成扩展和Epic同步
- API设计和实现
- 前端组件重构和迁移
- 数据迁移脚本和工具
- 测试覆盖和文档更新

### 不包含范围
- 现有GitLab集成功能的完全重写
- 权限系统的重大变更
- 数据库引擎的更换
- 前端框架的升级

## 确认所有不确定性已解决

✅ 数据模型重构策略：采用渐进式重构，保持向后兼容
✅ GitLab集成扩展：新增Epic映射表，扩展API服务
✅ API设计策略：保持兼容性，新增层级结构API
✅ 前端重构策略：渐进式迁移，适配器模式
✅ 数据迁移策略：无损迁移，支持回滚
✅ 技术架构：基于现有NestJS架构扩展

所有关键决策点已确认，可以进入DESIGN阶段。
