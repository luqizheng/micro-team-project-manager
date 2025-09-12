<template>
  <div class="simple-markdown-editor">
    <div class="editor-toolbar">
      <a-space>
        <a-button-group size="small">
          <a-button @click="insertText('**', '**')" title="粗体">
            <strong>B</strong>
          </a-button>
          <a-button @click="insertText('*', '*')" title="斜体">
            <em>I</em>
          </a-button>
          <a-button @click="insertText('`', '`')" title="代码">
            <code>Code</code>
          </a-button>
        </a-button-group>
        
        <a-button-group size="small">
          <a-button @click="insertText('# ', '')" title="标题1">H1</a-button>
          <a-button @click="insertText('## ', '')" title="标题2">H2</a-button>
          <a-button @click="insertText('### ', '')" title="标题3">H3</a-button>
        </a-button-group>
        
        <a-button-group size="small">
          <a-button @click="insertList('* ')" title="无序列表">•</a-button>
          <a-button @click="insertList('1. ')" title="有序列表">1.</a-button>
          <a-button @click="insertText('> ', '')" title="引用">></a-button>
        </a-button-group>
        
        <a-button-group size="small">
          <a-button @click="insertLink" title="链接">🔗</a-button>
          <a-button @click="insertImage" title="图片">🖼️</a-button>
        </a-button-group>
        
        <a-divider type="vertical" />
        
        <a-upload
          :file-list="fileList"
          :before-upload="beforeUpload"
          :custom-request="customUpload"
          :show-upload-list="false"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        >
          <a-button size="small" type="dashed">
            <template #icon><UploadOutlined /></template>
            上传附件
          </a-button>
        </a-upload>
      </a-space>
    </div>
    
    <div class="editor-content">
      <a-tabs v-model:activeKey="activeTab" type="card" size="small">
        <a-tab-pane key="edit" tab="编辑">
          <a-textarea
            ref="textareaRef"
            v-model:value="content"
            :placeholder="placeholder"
            :rows="rows"
            :disabled="disabled"
            @paste="handlePaste"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            class="markdown-textarea"
          />
        </a-tab-pane>
        <a-tab-pane key="preview" tab="预览">
          <div class="markdown-preview" v-html="renderedContent"></div>
        </a-tab-pane>
      </a-tabs>
    </div>
    
    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <a-progress :percent="uploadProgress" :status="uploadStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import http from '../api/http';

interface Props {
  modelValue?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  projectId?: string;
  issueId?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'upload-success', files: any[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入描述内容...',
  rows: 8,
  disabled: false,
});

const emit = defineEmits<Emits>();

const content = ref(props.modelValue || '');
const activeTab = ref('edit');
const textareaRef = ref();
const fileList = ref<any[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref<'normal' | 'exception' | 'active' | 'success'>('normal');

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  content.value = newValue || '';
});

// 监听内容变化
watch(content, (newValue) => {
  emit('update:modelValue', newValue);
});

// 简单的Markdown渲染
const renderedContent = computed(() => {
  if (!content.value) return '<p class="text-muted">暂无内容</p>';
  
  let html = content.value
    // 标题
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 列表
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // 引用
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 粗体和斜体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
    // 换行
    .replace(/\n/g, '<br>');
  
  return html;
});

// 插入文本
const insertText = (before: string, after: string) => {
  const textarea = textareaRef.value?.$el;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);
  
  const newText = before + selectedText + after;
  const newContent = content.value.substring(0, start) + newText + content.value.substring(end);
  
  content.value = newContent;
  
  nextTick(() => {
    const newStart = start + before.length;
    const newEnd = newStart + selectedText.length;
    textarea.setSelectionRange(newStart, newEnd);
    textarea.focus();
  });
};

// 插入列表
const insertList = (prefix: string) => {
  const textarea = textareaRef.value?.$el;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const lines = content.value.split('\n');
  let currentLine = 0;
  let charCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (charCount + lines[i].length >= start) {
      currentLine = i;
      break;
    }
    charCount += lines[i].length + 1;
  }
  
  lines[currentLine] = prefix + lines[currentLine];
  content.value = lines.join('\n');
  
  nextTick(() => {
    textarea.focus();
  });
};

// 插入链接
const insertLink = () => {
  const textarea = textareaRef.value?.$el;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);
  
  const linkText = selectedText || '链接文本';
  const linkUrl = 'https://';
  const newText = `[${linkText}](${linkUrl})`;
  
  const newContent = content.value.substring(0, start) + newText + content.value.substring(end);
  content.value = newContent;
  
  nextTick(() => {
    const newStart = start + linkText.length + 3;
    const newEnd = newStart + linkUrl.length;
    textarea.setSelectionRange(newStart, newEnd);
    textarea.focus();
  });
};

// 插入图片
const insertImage = () => {
  const textarea = textareaRef.value?.$el;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);
  
  const altText = selectedText || '图片描述';
  const imageUrl = 'https://';
  const newText = `![${altText}](${imageUrl})`;
  
  const newContent = content.value.substring(0, start) + newText + content.value.substring(end);
  content.value = newContent;
  
  nextTick(() => {
    const newStart = start + altText.length + 4;
    const newEnd = newStart + imageUrl.length;
    textarea.setSelectionRange(newStart, newEnd);
    textarea.focus();
  });
};

// 处理粘贴事件
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        await uploadFile(file);
      }
    }
  }
};

// 处理拖拽事件
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
  }
};

// 上传前检查
const beforeUpload = (file: any) => {
  const isValidSize = file.size / 1024 / 1024 < 10;
  if (!isValidSize) {
    message.error('文件大小不能超过 10MB');
    return false;
  }
  return true;
};

// 自定义上传
const customUpload = async (options: any) => {
  const { file } = options;
  await uploadFile(file);
};

// 上传文件
const uploadFile = async (file: File) => {
  if (!props.projectId || !props.issueId) {
    message.error('缺少项目ID或事项ID');
    return;
  }
  
  uploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = 'active';
  
  try {
    const objectKey = `${props.projectId}/${props.issueId}/${Date.now()}-${encodeURIComponent(file.name)}`;
    const res = await http.post(`/attachments/presign`, {
      key: objectKey,
      contentType: file.type
    });
    
    const { url, fields } = res.data.data || res.data;
    
    const formData = new FormData();
    Object.keys(fields || {}).forEach((k) => formData.append(k, fields[k]));
    formData.append('file', file);
    
    const uploadRes = await fetch(url, { 
      method: 'POST', 
      body: formData 
    });
    
    if (!uploadRes.ok) {
      throw new Error('上传失败');
    }
    
    await http.post(`/attachments/issues/${props.issueId}/record`, {
      objectKey,
      fileName: file.name,
      size: file.size,
      contentType: file.type
    });
    
    const fileUrl = `${url}/${objectKey}`;
    const isImage = file.type.startsWith('image/');
    const markdownLink = isImage 
      ? `![${file.name}](${fileUrl})`
      : `[${file.name}](${fileUrl})`;
    
    const textarea = textareaRef.value?.$el;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = content.value.substring(0, start) + markdownLink + content.value.substring(start);
      content.value = newContent;
    }
    
    uploadStatus.value = 'success';
    uploadProgress.value = 100;
    message.success('文件上传成功');
    
    emit('upload-success', [{ objectKey, fileName: file.name, url: fileUrl }]);
    
  } catch (error: any) {
    console.error('文件上传失败:', error);
    uploadStatus.value = 'exception';
    message.error(error?.response?.data?.message || '文件上传失败');
  } finally {
    setTimeout(() => {
      uploading.value = false;
      uploadProgress.value = 0;
      uploadStatus.value = 'normal';
    }, 2000);
  }
};

defineExpose({
  focus: () => textareaRef.value?.focus(),
  insertText,
  insertImage,
  insertLink,
});
</script>

<style scoped>
.simple-markdown-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  background: #fafafa;
  padding: 8px 12px;
  border-bottom: 1px solid #d9d9d9;
}

.editor-content {
  background: white;
}

.markdown-textarea {
  border: none;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.markdown-textarea:focus {
  box-shadow: none;
  border-color: transparent;
}

.markdown-preview {
  padding: 12px;
  min-height: 200px;
  background: white;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
}

.markdown-preview :deep(p) {
  margin-bottom: 16px;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-bottom: 16px;
  padding-left: 2em;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25em;
}

.markdown-preview :deep(blockquote) {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

.markdown-preview :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.markdown-preview :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  margin-bottom: 16px;
}

.markdown-preview :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 3px;
}

.upload-progress {
  padding: 8px 12px;
  background: #fafafa;
  border-top: 1px solid #d9d9d9;
}

.text-muted {
  color: #999;
}
</style>
