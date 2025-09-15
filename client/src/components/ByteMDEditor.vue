<template>
  <div class="bytemd-editor">
    <div class="editor-toolbar" v-if="edit">
      <a-space>
        <a-button size="small" @click="toggleMode">
          {{ mode === "split" ? "分屏模式" : "编辑模式" }}
        </a-button>
        <!-- <a-button size="small" @click="addTestContent"> 添加测试内容 </a-button> -->
      </a-space>
    </div>

    <div class="editor-content" @paste="edit ? handlePaste : null">
      <!-- 编辑模式 -->
      <Editor
        v-if="edit"
        :value="content"
        :plugins="plugins"
        :mode="mode"
        :placeholder="placeholder"
        :upload-images="uploadImages"
        :max-length="maxLength"
        :editor-config="editorConfig"
        @change="handleChange"
      />
      <!-- 查看模式 -->
      <Viewer
        v-else
        :value="content"
        :plugins="plugins"
      />
    </div>

    <!-- 调试信息 -->
    <!-- <div
      class="debug-info"
      style="padding: 10px; background: #f5f5f5; font-size: 12px"
    >
      <div>内容长度: {{ content.length }}</div>
      <div>模式: {{ mode }}</div>
      <div>插件数量: {{ plugins.length }}</div>
    </div> -->
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { Editor,Viewer } from "@bytemd/vue-next";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import http from "../api/http";

// 导入 ByteMD 样式
import "bytemd/dist/index.css";

export default {
  name: "ByteMDEditor",
  components: {
    Editor,
    Viewer,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "请输入描述内容...",
    },
    maxLength: {
      type: Number,
      default: 10000,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    edit: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: String,
      default: "",
    },
    issueId: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "upload-success"],
  setup(props, { emit }) {
    // 响应式数据
    const content = ref(
      props.modelValue ||
        '# 欢迎使用 ByteMD 编辑器\n\n这是一个 **Markdown** 编辑器示例。\n\n## 功能特性\n\n- 实时预览\n- 代码高亮\n- 数学公式支持\n- Mermaid 图表\n\n```javascript\nconsole.log("Hello ByteMD!");\n```\n\n> 开始编辑上面的内容来测试预览功能！'
    );
    const mode = ref("split");

    // 配置 ByteMD 插件 - 先只使用基础插件
    const plugins = [
      gfm(), // GitHub Flavored Markdown
      highlight(), // 代码高亮
    ];

    // 编辑器配置
    const editorConfig = {
      lineNumbers: true,
      lineWrapping: true,
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    };

    // 监听外部值变化
    watch(
      () => props.modelValue,
      (newValue) => {
        content.value = newValue || "";
      }
    );

    // 监听内容变化
    watch(content, (newValue) => {
      emit("update:modelValue", newValue);
    });

    // 处理内容变化
    const handleChange = (value) => {
      content.value = value;
    };

    // 切换编辑模式
    const toggleMode = () => {
      mode.value = mode.value === "split" ? "tab" : "split";
    };

    // 添加测试内容
    const addTestContent = () => {
      content.value = `# 测试标题

这是一个 **粗体** 文本示例。

## 功能特性

- 实时预览
- 代码高亮
- 数学公式支持
- Mermaid 图表

\`\`\`javascript
console.log("Hello ByteMD!");
\`\`\`

> 开始编辑上面的内容来测试预览功能！

## 表格示例

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 行1 | 行1 | 行1 |
| 行2 | 行2 | 行2 |

## 任务列表

- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 另一个任务`;
    };

    // 图片上传处理
    const uploadImages = async (files) => {
      if (!props.projectId || !props.issueId) {
        message.error("缺少项目ID或事项ID");
        return [];
      }

      const uploadedUrls = [];

      for (const file of files) {
        try {
          // 获取预签名上传URL
          const objectKey = `${props.projectId}/${
            props.issueId
          }/${Date.now()}-${encodeURIComponent(file.name)}`;
          const res = await http.post(`/attachments/presign`, {
            key: objectKey,
            contentType: file.type,
          });

          const { url, fields } = res.data.data || res.data;

          // 使用表单直传
          const formData = new FormData();
          Object.keys(fields || {}).forEach((k) =>
            formData.append(k, fields[k])
          );
          formData.append("file", file);

          const uploadRes = await fetch(url, {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error("上传失败");
          }

          // 记录附件信息
          await http.post(`/attachments/issues/${props.issueId}/record`, {
            objectKey,
            fileName: file.name,
            size: file.size,
            contentType: file.type,
          });

          const fileUrl = `${url}/${objectKey}`;
          uploadedUrls.push(fileUrl);

          message.success("图片上传成功");
        } catch (error) {
          console.error("图片上传失败:", error);
          message.error(error?.response?.data?.message || "图片上传失败");
        }
      }

      return uploadedUrls;
    };

    // 处理粘贴事件
    const handlePaste = async (event) => {
      debugger;
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // 检查文件大小
            if (file.size > 10 * 1024 * 1024) {
              message.error("文件大小不能超过 10MB");
              return;
            }

            // 调用现有的上传函数
            await uploadImages([file]);
          }
        }
      }
    };

    return {
      content,
      mode,
      plugins,
      editorConfig,
      handleChange,
      toggleMode,
      addTestContent,
      uploadImages,
      handlePaste,
    };
  },
};
</script>

<style scoped>
.bytemd-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
}

.editor-toolbar {
  background: #fafafa;
  padding: 8px 12px;
  border-bottom: 1px solid #d9d9d9;
}

.editor-content {
  background: white;
}

.debug-info {
  border-top: 1px solid #d9d9d9;
  font-family: monospace;
}

/* ByteMD 编辑器样式覆盖 */
:deep(.bytemd) {
  height: 500px;
  border: none;
}

:deep(.bytemd-toolbar) {
  border-bottom: 1px solid #e8e8e8;
}

:deep(.bytemd-editor) {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.bytemd-preview) {
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
}

/* 确保预览区域有内容 */
:deep(.bytemd-preview) {
  min-height: 200px;
  background: #fafafa;
}

/* Viewer 查看模式样式 */
:deep(.bytemd-viewer) {
  padding: 16px;
  min-height: 200px;
  background: #fafafa;
}

/* 代码高亮样式 */
:deep(.bytemd-preview pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(.bytemd-preview code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 85%;
}
</style>
