# CONSENSUS_GitLab分组映射功能

## 明确的需求描述和验收标准

### 核心需求
实现GitLab分组(Group)与PM中项目(Project)的映射功能，允许用户将PM项目与GitLab分组建立关联关系，实现分组级别的集成管理。

### 功能范围
1. **数据模型**: 创建GitLabGroupMapping实体，支持PM项目与GitLab分组的一对多映射
2. **API服务**: 扩展GitLab API服务，支持分组列表获取和分组详情查询
3. **业务逻辑**: 实现分组映射的完整CRUD操作
4. **前端界面**: 在项目详情页面添加分组映射管理功能
5. **权限控制**: 确保只有管理员和项目管理员可以管理分组映射

### 技术实现方案

#### 1. 数据模型设计
```typescript
// GitLabGroupMapping实体
@Entity('gitlab_group_mappings')
export class GitLabGroupMapping {
  id: string;                    // 主键
  projectId: string;             // PM项目ID
  gitlabInstanceId: string;      // GitLab实例ID
  gitlabGroupId: number;         // GitLab分组ID
  gitlabGroupPath: string;       // GitLab分组路径
  isActive: boolean;             // 是否激活
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  
  // 关联关系
  project: Project;              // 关联的PM项目
  gitlabInstance: GitLabInstance; // 关联的GitLab实例
}
```

#### 2. API接口设计
- `GET /gitlab/instances/:instanceId/groups` - 获取GitLab分组列表
- `GET /gitlab/instances/:instanceId/groups/:groupId` - 获取GitLab分组详情
- `GET /projects/:projectId/gitlab-groups` - 获取项目的分组映射列表
- `POST /projects/:projectId/gitlab-groups` - 创建分组映射
- `PUT /projects/:projectId/gitlab-groups/:mappingId` - 更新分组映射
- `DELETE /projects/:projectId/gitlab-groups/:mappingId` - 删除分组映射

#### 3. 前端界面设计
- 在项目详情页面添加"GitLab分组映射"卡片
- 提供分组映射列表展示
- 支持添加、编辑、删除分组映射
- 分组选择器支持搜索和分页

### 技术约束和集成方案

#### 技术约束
- 必须与现有GitLab集成架构保持一致
- 使用现有的TypeORM实体模式和NestJS服务架构
- 遵循现有的API设计规范和错误处理机制
- 使用现有的权限控制机制(RolesGuard)

#### 集成方案
- 复用现有的GitLab API服务(GitLabApiGitBeakerService)
- 扩展现有的GitLab集成控制器
- 集成到现有的项目详情页面
- 使用现有的GitLab实例管理功能

#### 数据一致性
- 映射关系支持软删除(isActive字段)
- 删除PM项目时级联删除相关映射
- 删除GitLab实例时级联删除相关映射
- 支持映射状态的审计日志

### 任务边界限制

#### 包含范围
- GitLab分组映射实体的创建和数据库迁移
- 分组映射的完整CRUD API实现
- GitLab分组列表和详情API
- 前端分组映射管理界面
- 权限控制和数据验证

#### 不包含范围
- 分组内项目的自动同步
- 分组成员的自动同步
- 分组级别的权限管理
- 分组统计信息的详细展示
- 分组Webhook集成

### 验收标准

#### 功能验收
1. ✅ 能够创建PM项目与GitLab分组的映射关系
2. ✅ 能够查看、编辑、删除分组映射
3. ✅ 能够获取GitLab分组列表（带权限过滤和搜索）
4. ✅ 前端界面友好，操作流程清晰
5. ✅ 权限控制正确，只有授权用户可以管理映射

#### 技术验收
1. ✅ 代码符合项目现有规范
2. ✅ 数据库迁移脚本正确
3. ✅ API接口文档完整
4. ✅ 单元测试覆盖核心功能
5. ✅ 集成测试通过

#### 性能验收
1. ✅ 分组列表加载时间 < 3秒
2. ✅ 映射操作响应时间 < 2秒
3. ✅ 支持分页加载大量分组数据
4. ✅ 内存使用合理，无内存泄漏

### 关键决策点确认

#### 1. 映射关系设计
**决策**: 支持一对多映射，一个PM项目可以关联多个GitLab分组
**理由**: 提供更灵活的集成方式，支持复杂的项目结构

#### 2. 权限验证策略
**决策**: 创建映射时验证用户对GitLab分组的访问权限
**理由**: 确保数据安全，防止用户访问无权限的分组

#### 3. 分组信息展示
**决策**: 在映射列表中展示基本分组信息（名称、路径、项目数量等）
**理由**: 提供足够的上下文信息，便于用户识别和管理

#### 4. 映射状态管理
**决策**: 支持映射的启用/禁用状态，与现有项目映射保持一致
**理由**: 提供灵活的映射管理，支持临时禁用而不删除映射

#### 5. 前端集成位置
**决策**: 在项目详情页面添加分组映射管理卡片
**理由**: 与现有成员管理功能保持一致，提供统一的项目管理体验

### 实现优先级
1. **高优先级**: 数据模型和API实现
2. **中优先级**: 前端界面实现
3. **低优先级**: 高级功能和优化

### 风险评估
- **低风险**: 基于现有架构扩展，技术方案成熟
- **中风险**: 需要确保与现有GitLab集成的兼容性
- **缓解措施**: 充分测试，遵循现有代码规范

### 确认所有不确定性已解决
✅ 映射关系类型：一对多映射
✅ 权限验证策略：创建时验证访问权限
✅ 分组信息展示：基本信息和统计
✅ 映射状态管理：支持启用/禁用
✅ 前端集成位置：项目详情页面
✅ 技术架构：基于现有GitLab集成扩展
✅ 数据一致性：级联删除和软删除
✅ 性能要求：明确的响应时间标准
