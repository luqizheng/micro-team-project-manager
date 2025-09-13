# DESIGN_复制粘贴上传功能

## 整体架构图

```mermaid
graph TB
    A[用户复制文件/图片] --> B[Ctrl+V 粘贴到 ByteMDEditor]
    B --> C[触发 paste 事件]
    C --> D[检测剪贴板数据类型]
    D --> E{是否为图片/文件?}
    E -->|是| F[调用 handlePaste 函数]
    E -->|否| G[正常文本粘贴]
    F --> H[获取文件对象]
    H --> I[调用 uploadImages 函数]
    I --> J[获取预签名URL]
    J --> K[上传文件到存储]
    K --> L[记录附件信息到数据库]
    L --> M[生成 Markdown 链接]
    M --> N[插入到编辑器光标位置]
    N --> O[显示成功提示]
    
    I --> P[上传失败]
    P --> Q[显示错误提示]
```

## 分层设计和核心组件

### 1. 表示层 (Presentation Layer)
- **ByteMDEditor.vue**: 主编辑器组件
- **事件监听器**: 监听 paste 事件
- **用户反馈**: 进度提示和错误消息

### 2. 业务逻辑层 (Business Logic Layer)
- **handlePaste 函数**: 处理粘贴事件的核心逻辑
- **uploadImages 函数**: 复用现有的文件上传逻辑
- **文件验证**: 文件类型和大小检查

### 3. 数据访问层 (Data Access Layer)
- **HTTP API**: 调用预签名URL和记录附件信息
- **文件存储**: 通过预签名URL直传文件

## 模块依赖关系图

```mermaid
graph LR
    A[ByteMDEditor.vue] --> B[handlePaste 函数]
    A --> C[uploadImages 函数]
    B --> D[Clipboard API]
    C --> E[HTTP API 调用]
    C --> F[文件上传逻辑]
    E --> G[预签名URL API]
    E --> H[附件记录 API]
    F --> I[文件存储服务]
```

## 接口契约定义

### 1. handlePaste 函数接口
```typescript
interface PasteHandler {
  (event: ClipboardEvent): Promise<void>
}
```

**输入契约**:
- `event: ClipboardEvent` - 粘贴事件对象

**输出契约**:
- 无返回值
- 副作用: 触发文件上传和插入Markdown链接

### 2. uploadImages 函数接口
```typescript
interface UploadImagesHandler {
  (files: File[]): Promise<string[]>
}
```

**输入契约**:
- `files: File[]` - 要上传的文件数组

**输出契约**:
- `Promise<string[]>` - 返回上传后的文件URL数组

## 数据流向图

```mermaid
sequenceDiagram
    participant U as 用户
    participant E as ByteMDEditor
    participant A as API
    participant S as 存储服务
    participant D as 数据库
    
    U->>E: 复制文件并粘贴
    E->>E: 检测 paste 事件
    E->>E: 提取文件对象
    E->>A: 请求预签名URL
    A->>E: 返回预签名URL和字段
    E->>S: 上传文件
    S->>E: 返回上传结果
    E->>A: 记录附件信息
    A->>D: 保存附件元数据
    E->>E: 插入Markdown链接
    E->>U: 显示成功提示
```

## 异常处理策略

### 1. 文件类型验证失败
- **处理方式**: 显示错误提示，不执行上传
- **用户反馈**: "不支持的文件类型"

### 2. 文件大小超限
- **处理方式**: 显示错误提示，不执行上传
- **用户反馈**: "文件大小不能超过 10MB"

### 3. 网络上传失败
- **处理方式**: 显示错误提示，不插入链接
- **用户反馈**: "文件上传失败，请重试"

### 4. API调用失败
- **处理方式**: 显示错误提示，不插入链接
- **用户反馈**: "服务暂时不可用，请稍后重试"

## 实现约束

### 1. 技术约束
- 必须使用现有的上传API和存储机制
- 保持与现有编辑器组件的API一致性
- 遵循Vue3 Composition API模式

### 2. 性能约束
- 文件上传不应阻塞编辑器其他功能
- 支持异步上传，不阻塞用户操作
- 合理处理大文件上传的超时问题

### 3. 安全约束
- 文件类型验证防止恶意文件上传
- 文件大小限制防止存储空间滥用
- 使用预签名URL确保上传安全性

## 集成方案

### 1. 与现有组件集成
- 复用 `MarkdownEditor.vue` 和 `SimpleMarkdownEditor.vue` 的粘贴处理逻辑
- 保持相同的用户体验和错误处理方式
- 使用相同的上传API和存储机制

### 2. 与ByteMD编辑器集成
- 在编辑器配置中添加粘贴事件监听
- 利用ByteMD的API在光标位置插入内容
- 保持编辑器的现有功能和样式不变

### 3. 与后端API集成
- 使用现有的 `/attachments/presign` 接口
- 使用现有的 `/attachments/issues/{issueId}/record` 接口
- 保持与现有上传流程的完全兼容
