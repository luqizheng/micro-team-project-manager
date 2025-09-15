# IssueDetail 优化 - 共识文档

## 明确的需求描述

### 核心需求
将 IssueDetail.vue 中的 markdown 编辑器从"始终编辑"模式优化为"点击编辑"模式，提升用户体验。

### 具体功能要求
1. **默认预览模式**：描述区域默认显示为只读的 markdown 预览
2. **编辑按钮**：在描述区域右上角添加编辑按钮（仅对有权限的用户显示）
3. **编辑模式切换**：点击编辑按钮后进入编辑模式，显示 ByteMDEditor
4. **操作按钮**：编辑模式下提供"保存"和"取消"按钮
5. **状态管理**：保存成功后切换回预览模式，取消时恢复原始内容

## 技术实现方案

### 状态管理
```typescript
const isEditingDescription = ref(false);
const originalDescription = ref('');
```

### UI 组件结构
```vue
<div class="description-section">
  <div class="description-header">
    <span>描述</span>
    <a-button v-if="canEdit && !isEditingDescription" @click="startEdit">编辑</a-button>
  </div>
  
  <!-- 预览模式 -->
  <div v-if="!isEditingDescription" class="markdown-preview" v-html="renderedMarkdown"></div>
  
  <!-- 编辑模式 -->
  <div v-else class="markdown-editor">
    <ByteMDEditor 
      v-model="issue.description" 
      :project-id="projectId"
      :issue-id="issueId"
      @update:modelValue="handleDescriptionChange"
    />
    <div class="editor-actions">
      <a-button @click="cancelEdit">取消</a-button>
      <a-button type="primary" @click="saveEdit" :loading="saving">保存</a-button>
    </div>
  </div>
</div>
```

### 核心方法
- `startEdit()`: 进入编辑模式，保存原始内容
- `saveEdit()`: 保存更改，切换回预览模式
- `cancelEdit()`: 取消编辑，恢复原始内容，切换回预览模式

## 技术约束

### 保持现有功能
- 复用现有的 ByteMDEditor 组件
- 保持现有的权限控制逻辑（`canTransition` 计算属性）
- 保持现有的 API 调用方式
- 保持现有的错误处理机制

### 样式要求
- 与现有 Ant Design Vue 组件风格保持一致
- 编辑按钮使用小尺寸，位置在描述标题右侧
- 操作按钮组右对齐，间距合理

## 验收标准

### 功能验收
1. ✅ 默认状态下描述区域显示为只读的 markdown 预览
2. ✅ 有编辑权限的用户可以看到编辑按钮
3. ✅ 点击编辑按钮后进入编辑模式，显示 ByteMDEditor
4. ✅ 编辑模式下提供保存和取消按钮
5. ✅ 保存成功后切换回预览模式
6. ✅ 取消编辑时恢复原始内容并切换回预览模式
7. ✅ 保持现有的权限控制和数据保存逻辑

### 技术验收
1. ✅ 代码遵循项目现有的 Vue3 Composition API 模式
2. ✅ 样式与 Ant Design Vue 组件保持一致
3. ✅ 错误处理机制完善
4. ✅ 性能优化合理（避免不必要的重新渲染）

## 实现边界

### 包含范围
- IssueDetail.vue 中的描述字段编辑优化
- 编辑模式切换逻辑
- 预览模式渲染

### 不包含范围
- ByteMDEditor 组件本身的修改
- 其他字段的编辑模式优化
- 权限系统的修改

## 风险评估

### 低风险
- 基于现有组件和 API，技术实现风险较低
- 不影响现有功能，向后兼容

### 注意事项
- 需要确保 markdown 预览的样式与编辑模式一致
- 需要处理空内容的显示情况
- 需要确保取消编辑时正确恢复原始内容
