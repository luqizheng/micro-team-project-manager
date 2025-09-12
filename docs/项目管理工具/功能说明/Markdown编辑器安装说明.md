# Markdown编辑器安装说明

## 概述

Markdown编辑器功能需要安装额外的依赖包才能正常工作。本文档说明如何安装和配置这些依赖。

## 依赖包

### 必需依赖
- `marked`: Markdown解析库
- `dompurify`: HTML安全过滤库

### 版本要求
- `marked`: ^12.0.0
- `dompurify`: ^3.0.8

## 安装步骤

### 1. 自动安装（推荐）
```bash
# 运行安装脚本
./scripts/install-markdown-deps.sh

# 或者在Windows PowerShell中
npm run install:markdown-deps
```

### 2. 手动安装
```bash
# 进入客户端目录
cd client

# 安装依赖
npm install dompurify@^3.0.8 marked@^12.0.0

# 或者使用yarn
yarn add dompurify@^3.0.8 marked@^12.0.0
```

### 3. 验证安装
```bash
# 检查依赖是否安装成功
npm list dompurify marked
```

## 配置说明

### 1. 启用完整功能
安装依赖后，需要取消注释MarkdownEditor.vue中的导入语句：

```typescript
// 取消注释以下行
import DOMPurify from 'dompurify';
import { marked } from 'marked';
```

### 2. 启用完整渲染
将简化的渲染函数替换为完整版本：

```typescript
// 替换为完整版本
const renderedContent = computed(() => {
  if (!content.value) return '<p class="text-muted">暂无内容</p>';
  
  try {
    const html = marked(content.value);
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Markdown渲染错误:', error);
    return '<p class="text-error">Markdown渲染错误</p>';
  }
});
```

## 功能特性

### 安装前（基础版本）
- ✅ 基础Markdown语法支持
- ✅ 工具栏功能
- ✅ 文件上传功能
- ✅ 编辑/预览切换
- ❌ 完整Markdown渲染
- ❌ HTML安全过滤

### 安装后（完整版本）
- ✅ 完整Markdown语法支持
- ✅ 工具栏功能
- ✅ 文件上传功能
- ✅ 编辑/预览切换
- ✅ 完整Markdown渲染
- ✅ HTML安全过滤
- ✅ 表格支持
- ✅ 代码高亮
- ✅ 链接自动识别

## 使用说明

### 1. 基本使用
```vue
<template>
  <MarkdownEditor 
    v-model="content"
    placeholder="请输入内容..."
    :rows="8"
  />
</template>
```

### 2. 带附件上传
```vue
<template>
  <MarkdownEditor 
    v-model="content"
    :project-id="projectId"
    :issue-id="issueId"
    @upload-success="handleUploadSuccess"
  />
</template>
```

### 3. 工具栏功能
- **格式化**：粗体、斜体、代码
- **标题**：H1、H2、H3
- **列表**：有序、无序、引用
- **链接**：插入链接和图片
- **表格**：插入Markdown表格
- **上传**：上传附件

## 故障排除

### 1. 依赖安装失败
```bash
# 清除缓存后重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm install dompurify@^3.0.8 marked@^12.0.0
```

### 2. 类型声明错误
```bash
# 安装类型声明
npm install @types/dompurify --save-dev
```

### 3. 构建错误
```bash
# 检查Vite配置
# 确保支持ES模块导入
```

### 4. 运行时错误
- 检查控制台错误信息
- 确认依赖包版本正确
- 检查导入语句是否正确

## 性能优化

### 1. 按需加载
```typescript
// 可以配置按需加载
const marked = await import('marked');
const DOMPurify = await import('dompurify');
```

### 2. 缓存配置
```typescript
// 配置marked选项
const markedOptions = {
  breaks: true,
  gfm: true,
  tables: true,
  sanitize: false, // 使用DOMPurify处理
};
```

## 安全考虑

### 1. HTML过滤
- 使用DOMPurify过滤危险HTML
- 防止XSS攻击
- 清理用户输入

### 2. 文件上传
- 限制文件类型和大小
- 使用预签名URL
- 验证文件内容

## 更新说明

### 版本兼容性
- Vue 3.4+
- TypeScript 5.0+
- Node.js 16+

### 升级指南
1. 备份当前配置
2. 更新依赖包版本
3. 测试功能完整性
4. 更新相关代码

## 技术支持

如果遇到问题，请检查：
1. 依赖包是否正确安装
2. 版本是否兼容
3. 导入语句是否正确
4. 控制台错误信息

更多技术细节请参考：
- [marked文档](https://marked.js.org/)
- [DOMPurify文档](https://github.com/cure53/DOMPurify)
- [Vue 3文档](https://vuejs.org/)
