# Markdown编辑器功能说明

## 概述

为Issues的description字段添加了完整的Markdown编辑功能，支持富文本编辑、实时预览、复制粘贴上传附件、拖拽上传附件等特性。

## 主要功能

### 1. Markdown编辑
- **实时预览**：支持编辑和预览模式切换
- **语法高亮**：提供Markdown语法支持
- **工具栏**：提供常用Markdown语法快捷按钮
- **自动保存**：编辑时自动保存到后端

### 2. 附件上传
- **复制粘贴**：支持直接粘贴图片到编辑器
- **拖拽上传**：支持拖拽文件到编辑器区域
- **多种格式**：支持图片、PDF、文档、文本等格式
- **自动插入**：上传后自动插入Markdown链接

### 3. 富文本功能
- **格式化**：粗体、斜体、代码、标题等
- **列表**：有序列表、无序列表、引用
- **链接**：插入链接和图片
- **表格**：插入Markdown表格

## 组件特性

### MarkdownEditor组件
```vue
<MarkdownEditor 
  v-model="content"
  placeholder="请输入内容..."
  :rows="8"
  :project-id="projectId"
  :issue-id="issueId"
  @update:modelValue="handleChange"
  @upload-success="handleUploadSuccess"
/>
```

### Props
- `modelValue`: 双向绑定的内容
- `placeholder`: 占位符文本
- `rows`: 编辑器行数
- `disabled`: 是否禁用
- `projectId`: 项目ID（用于附件上传）
- `issueId`: 事项ID（用于附件上传）

### Events
- `update:modelValue`: 内容变化事件
- `upload-success`: 上传成功事件

## 使用场景

### 1. Issues创建/编辑
- **创建事项**：使用Markdown编辑器编写详细描述
- **编辑事项**：修改和更新事项描述
- **附件管理**：直接上传和插入附件

### 2. Issues详情查看
- **实时编辑**：在详情页面直接编辑描述
- **预览模式**：查看渲染后的Markdown内容
- **附件预览**：查看上传的附件

## 技术实现

### 1. 依赖包
```json
{
  "dompurify": "^3.0.8",  // HTML安全过滤
  "marked": "^12.0.0"     // Markdown解析
}
```

### 2. 核心功能
- **Markdown解析**：使用marked库解析Markdown
- **HTML安全**：使用DOMPurify过滤HTML内容
- **文件上传**：支持预签名URL上传
- **实时预览**：编辑时实时渲染预览

### 3. 上传机制
- **预签名URL**：获取临时上传URL
- **直传**：直接上传到存储服务
- **记录信息**：保存附件元数据到数据库
- **自动插入**：上传后自动插入Markdown链接

## 工具栏功能

### 格式化工具
- **粗体**：`**文本**`
- **斜体**：`*文本*`
- **代码**：`` `代码` ``

### 标题工具
- **H1**：`# 标题`
- **H2**：`## 标题`
- **H3**：`### 标题`

### 列表工具
- **无序列表**：`* 项目`
- **有序列表**：`1. 项目`
- **引用**：`> 引用内容`

### 链接工具
- **链接**：`[文本](URL)`
- **图片**：`![描述](URL)`
- **表格**：插入Markdown表格

## 上传功能

### 1. 复制粘贴上传
```javascript
// 监听粘贴事件
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      await uploadFile(file);
    }
  }
};
```

### 2. 拖拽上传
```javascript
// 处理拖拽事件
const handleDrop = async (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  for (let file of files) {
    await uploadFile(file);
  }
};
```

### 3. 文件上传流程
1. **获取预签名URL**：调用后端API获取上传URL
2. **直传文件**：使用FormData直接上传
3. **记录元数据**：保存文件信息到数据库
4. **插入链接**：自动插入Markdown链接到编辑器

## 样式设计

### 1. 编辑器样式
- **工具栏**：顶部工具栏，包含常用功能按钮
- **编辑区**：Monaco字体，支持语法高亮
- **预览区**：渲染后的HTML内容
- **上传进度**：显示上传进度条

### 2. 预览样式
- **标题**：不同级别的标题样式
- **列表**：有序和无序列表样式
- **代码**：代码块和行内代码样式
- **表格**：表格边框和样式
- **引用**：引用块样式

## 安全考虑

### 1. HTML过滤
- **DOMPurify**：过滤危险的HTML标签和属性
- **XSS防护**：防止跨站脚本攻击
- **内容清理**：确保渲染内容安全

### 2. 文件上传安全
- **文件类型检查**：限制允许的文件类型
- **文件大小限制**：限制上传文件大小（10MB）
- **预签名URL**：使用临时URL上传，提高安全性

## 性能优化

### 1. 渲染优化
- **懒加载**：预览时才渲染Markdown
- **防抖处理**：避免频繁渲染
- **缓存机制**：缓存渲染结果

### 2. 上传优化
- **并发控制**：限制同时上传的文件数量
- **进度显示**：显示上传进度
- **错误处理**：完善的错误处理机制

## 使用示例

### 1. 基本使用
```vue
<template>
  <MarkdownEditor 
    v-model="description"
    placeholder="请输入描述..."
    :rows="6"
  />
</template>

<script setup>
const description = ref('');
</script>
```

### 2. 带附件上传
```vue
<template>
  <MarkdownEditor 
    v-model="description"
    :project-id="projectId"
    :issue-id="issueId"
    @upload-success="handleUploadSuccess"
  />
</template>

<script setup>
const handleUploadSuccess = (files) => {
  console.log('上传成功:', files);
};
</script>
```

### 3. 禁用状态
```vue
<template>
  <MarkdownEditor 
    v-model="description"
    :disabled="!canEdit"
  />
</template>
```

## 注意事项

1. **依赖安装**：需要安装dompurify和marked依赖
2. **后端支持**：需要后端支持预签名URL上传
3. **文件存储**：需要配置文件存储服务
4. **权限控制**：需要适当的权限控制机制

这个Markdown编辑器为Issues管理提供了强大的内容编辑能力，支持富文本编辑、附件上传、实时预览等功能，大大提升了用户体验。
