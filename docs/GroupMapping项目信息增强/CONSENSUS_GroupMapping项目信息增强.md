# GroupMapping项目信息增强 - 共识文档

## 明确的需求描述

为 GitLab 分组映射功能增加 PM 项目信息的显示，包括：
1. 后端 DTO 增加项目详细信息
2. 前端表格优化显示项目信息
3. 搜索功能支持项目相关字段

## 技术实现方案

### 后端实现
- **DTO 增强**：在 `GroupMappingResponseDto` 中添加 `project` 字段，包含项目的完整信息
- **服务更新**：修改 `GitLabGroupMappingService.getProjectGroupMappings` 方法，通过 relations 加载项目信息
- **映射更新**：更新 `mapToResponseDto` 方法，将项目信息映射到响应DTO

### 前端实现
- **表格列优化**：将"GitLab项目"列改为"GitLab分组"，更准确地反映数据内容
- **项目信息显示**：增强项目信息显示，包含项目名称、Key、可见性标签和归档状态
- **搜索功能扩展**：支持按项目名称、项目Key、GitLab分组路径和分组名称搜索

## 技术约束

### 后端约束
- 保持现有API接口兼容性
- 使用现有的实体关系（GitLabGroupMapping -> ProjectEntity）
- 遵循现有的DTO模式

### 前端约束
- 保持Ant Design Vue组件的一致性
- 维持现有的响应式设计
- 确保搜索功能的性能

## 验收标准

### 功能验收
- [x] API返回包含完整项目信息的响应
- [x] 前端表格正确显示项目详细信息
- [x] 搜索功能支持所有相关字段
- [x] 项目信息包含名称、Key、可见性和归档状态

### 技术验收
- [x] 代码无TypeScript错误
- [x] 代码无ESLint错误
- [x] 保持现有代码风格
- [x] 实体关系正确加载

## 实现状态
✅ 所有功能已实现并测试通过
