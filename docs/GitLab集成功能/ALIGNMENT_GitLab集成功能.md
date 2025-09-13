# GitLab集成功能 - 对齐阶段

## 项目上下文分析

### 现有项目架构
- **技术栈**: Vue3 + Ant Design + NestJS + TypeORM + MySQL 8
- **架构模式**: 前后端分离，RESTful API + Webhook，事件驱动
- **现有集成**: 已有Webhook和Rule基础架构，支持统一集成抽象
- **权限系统**: 基于RBAC的三角色系统（Viewer/Member/Project Admin/System Admin）

### 现有集成基础设施
- 已有Webhook表结构：支持项目级webhook配置
- 已有Rule表结构：支持自动化规则配置
- 统一集成抽象设计：Provider接口（鉴权、Webhook验签、事件映射、API调用）
- 安全机制：HMAC-SHA256签名、IP白名单、令牌轮换

## 需求理解确认

### 原始需求
创建GitLab集成功能，首先实现GitLab Self-hosted（自托管）版本，后续扩展支持Gitee和GitHub。

### 核心特性
1. **GitLab Self-hosted集成**
   - 支持自托管GitLab实例连接
   - 获取System Hooks（系统级webhook）
   - 项目级集成配置
   - 事件同步和状态更新

2. **集成能力**
   - 项目同步：从GitLab同步项目信息
   - 用户同步：从GitLab同步用户信息
   - 事件监听：监听GitLab事件（push、merge request、issue等）
   - 状态同步：双向同步任务状态

3. **安全与权限**
   - 安全的API密钥管理
   - Webhook签名验证
   - 项目级权限控制

### 边界确认
- **包含范围**：
  - GitLab Self-hosted实例连接配置
  - System Hooks和Project Hooks支持
  - 基础的项目和用户同步
  - 事件监听和状态同步
  - 管理界面和配置界面

- **不包含范围**：
  - Gitee和GitHub集成（后续实现）
  - 复杂的CI/CD集成（基础支持）
  - 代码审查集成（基础支持）

## 需求理解

### 对现有项目的理解
1. **数据库设计**：已有Webhook和Rule表，需要扩展支持GitLab特定配置
2. **权限系统**：需要项目管理员权限来配置集成
3. **事件系统**：需要扩展现有事件系统支持GitLab事件
4. **API设计**：需要新增GitLab集成相关的API端点

### 技术约束
- 必须与现有NestJS架构兼容
- 必须使用现有的TypeORM实体系统
- 必须遵循现有的权限和安全机制
- 必须支持现有的Webhook验签机制

## 疑问澄清

### 关键决策点

1. **GitLab连接方式**
   - 使用Personal Access Token还是Deploy Token？
   - 是否需要支持OAuth2认证？
   - 如何管理多个GitLab实例的连接？

2. **System Hooks vs Project Hooks**
   - 优先实现System Hooks还是Project Hooks？
   - System Hooks需要管理员权限，如何处理权限问题？
   - 是否需要同时支持两种类型的Hooks？

3. **数据同步策略**
   - 实时同步还是定时同步？
   - 如何处理大量数据的增量同步？
   - 冲突解决策略（如用户信息冲突）？

4. **事件映射**
   - 哪些GitLab事件需要映射到项目管理工具？
   - 如何映射GitLab的Issue到项目管理工具的Issue？
   - 如何处理GitLab特有的概念（如Merge Request）？

5. **安全考虑**
   - 如何安全存储GitLab的API密钥？
   - 如何处理Webhook的IP白名单？
   - 如何防止Webhook重放攻击？

### 需要确认的技术细节

1. **GitLab API版本**：使用GitLab API v4还是v4？
2. **Webhook事件类型**：需要监听哪些具体的事件类型？
3. **数据存储**：是否需要新增表来存储GitLab特定的数据？
4. **错误处理**：如何处理GitLab API的限流和错误？
5. **监控和日志**：如何监控集成状态和性能？

## 下一步行动

需要用户确认以上关键决策点，特别是：
1. GitLab连接认证方式的选择
2. System Hooks vs Project Hooks的优先级
3. 数据同步策略的选择
4. 需要支持的具体事件类型

确认后进入CONSENSUS阶段。
