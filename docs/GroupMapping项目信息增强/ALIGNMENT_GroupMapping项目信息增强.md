# GroupMapping项目信息增强 - 对齐文档

## 项目上下文分析

### 现有项目结构
- 后端：NestJS + TypeORM + MySQL
- 前端：Vue 3 + Ant Design Vue + TypeScript
- 项目模块：GitLab集成功能模块

### 现有代码模式
- DTO模式：使用ResponseDto进行API响应
- 实体关系：GitLabGroupMapping与ProjectEntity通过ManyToOne关系关联
- 前端表格：使用Ant Design Vue的a-table组件

## 需求理解确认

### 原始需求
用户要求为 `GroupMappingResponseDto` 增加 PM project 的信息，并配合修改 `GitLabMappingsTab.vue` 的表格列表显示。

### 需求理解
1. **后端修改**：
   - 在 `GroupMappingResponseDto` 中增加项目信息字段
   - 修改分组映射服务以包含项目信息
   - 确保API返回完整的项目数据

2. **前端修改**：
   - 更新表格列配置，将"GitLab项目"改为"GitLab分组"
   - 修改项目信息显示，包含项目名称、Key、可见性等
   - 更新搜索功能以支持新的字段

### 边界确认
- 只修改分组映射相关的DTO和服务
- 保持现有API接口兼容性
- 前端表格样式保持一致性

## 技术实现方案

### 后端修改
1. **DTO增强**：在 `GroupMappingResponseDto` 中添加 `project` 字段
2. **服务更新**：修改 `getProjectGroupMappings` 方法包含项目关系
3. **映射更新**：更新 `mapToResponseDto` 方法以包含项目信息

### 前端修改
1. **表格列配置**：更新列标题和字段映射
2. **显示模板**：增强项目信息显示，包含Key和可见性标签
3. **搜索功能**：扩展搜索范围到项目Key和分组名称

## 验收标准
- [x] DTO包含完整的项目信息
- [x] API返回包含项目数据的响应
- [x] 前端表格正确显示项目信息
- [x] 搜索功能支持新的字段
- [x] 代码无linting错误
