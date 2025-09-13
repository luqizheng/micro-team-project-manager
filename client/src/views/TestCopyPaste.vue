<template>
  <div class="test-copy-paste">
    <h2>复制粘贴上传功能测试</h2>
    
    <div class="test-instructions">
      <h3>测试说明：</h3>
      <ol>
        <li>在任意图片编辑器中复制一张图片（如画图、Photoshop等）</li>
        <li>在下面的编辑器中按 Ctrl+V 粘贴</li>
        <li>观察是否自动上传并插入Markdown链接</li>
      </ol>
    </div>

    <div class="editor-container">
      <h4>ByteMD编辑器测试：</h4>
      <ByteMDEditor
        v-model="content"
        :project-id="testProjectId"
        :issue-id="testIssueId"
        placeholder="请在此处粘贴图片进行测试..."
      />
    </div>

    <div class="test-results">
      <h4>测试结果：</h4>
      <p>当前内容长度: {{ content.length }}</p>
      <div class="content-preview">
        <h5>内容预览：</h5>
        <pre>{{ content }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ByteMDEditor from '../components/ByteMDEditor.vue';

// 测试用的项目ID和事项ID
const testProjectId = 'test-project';
const testIssueId = 'test-issue';

const content = ref(`# 复制粘贴上传功能测试

请按照上面的说明进行测试：

1. 复制一张图片
2. 按 Ctrl+V 粘贴到编辑器中
3. 观察是否自动上传并插入Markdown链接

## 测试内容

这里可以输入一些测试内容...

`);
</script>

<style scoped>
.test-copy-paste {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-instructions {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.test-instructions ol {
  margin: 10px 0;
  padding-left: 20px;
}

.editor-container {
  margin-bottom: 20px;
}

.test-results {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.content-preview {
  margin-top: 10px;
}

.content-preview pre {
  background: #f6f8fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
