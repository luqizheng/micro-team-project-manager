# IssueDetail 优化 - 对齐文档

## 项目上下文分析

### 现有项目结构
- 前端：Vue3 + Ant Design Vue
- 后端：NestJS + TypeORM + MySQL
- 当前 IssueDetail.vue 使用 ByteMDEditor 组件进行 markdown 编辑

### 现有代码模式
- IssueDetail.vue 直接使用 ByteMDEditor 组件，始终处于编辑状态
- ByteMDEditor 组件支持分屏模式和编辑模式切换
- 描述字段通过 `@update:modelValue` 事件实时更新到后端

## 需求理解确认

### 原始需求
优化 IssueDetail.vue 的显示方式，特别是：
1. markdown editor 点击编辑才进入编辑状态

### 需求理解
用户希望将 markdown 编辑器从"始终编辑"模式改为"点击编辑"模式，即：
- 默认显示为只读的 markdown 预览
- 点击编辑按钮后才进入编辑状态
- 编辑完成后可以保存或取消

### 边界确认
- 仅优化 IssueDetail.vue 中的描述字段编辑体验
- 保持现有的 ByteMDEditor 组件功能不变
- 保持现有的权限控制逻辑
- 保持现有的数据保存机制

### 疑问澄清
1. 编辑按钮的样式和位置：是否在描述区域右上角添加编辑按钮？
2. 取消编辑的处理：是否需要提供取消按钮，恢复原始内容？
3. 保存时机：是实时保存还是点击保存按钮？
4. 权限控制：是否只有有编辑权限的用户才能看到编辑按钮？

## 技术实现方案

### 方案概述
在 IssueDetail.vue 中添加编辑状态管理，控制 ByteMDEditor 的显示模式：
- 添加 `isEditingDescription` 状态变量
- 默认显示 markdown 预览（只读模式）
- 点击编辑按钮切换到编辑模式
- 提供保存和取消按钮

### 技术约束
- 保持与现有 Ant Design Vue 组件风格一致
- 复用现有的 ByteMDEditor 组件
- 保持现有的权限控制逻辑
- 保持现有的 API 调用方式

## 验收标准
1. 默认状态下描述区域显示为只读的 markdown 预览
2. 有编辑权限的用户可以看到编辑按钮
3. 点击编辑按钮后进入编辑模式，显示 ByteMDEditor
4. 编辑模式下提供保存和取消按钮
5. 保存成功后切换回预览模式
6. 取消编辑时恢复原始内容并切换回预览模式
7. 保持现有的权限控制和数据保存逻辑
