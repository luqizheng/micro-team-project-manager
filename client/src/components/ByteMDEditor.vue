<template>
  <div class="mdv3-editor">
    <div class="editor-content">
      <!-- 编辑模式（md-editor-v3） -->
      <MdEditor
        v-if="edit"
        v-model="content"
        :placeholder="placeholder"
        :maxlength="maxLength"
        :preview="mode === 'split'"
        :show-code-row-number="true"
        @on-change="handleChange"
        @onUploadImg="handleUploadImg"
      />
      <!-- 查看模式（md-editor-v3） -->
      <MdPreview v-else :modelValue="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { MdEditor, MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import http from "../api/http";

const props = defineProps<{
  modelValue: string;
  placeholder: string;
  maxLength: number;
  disabled: boolean;
  edit: boolean;
  projectId: string;
  issueId: string;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "upload-success", value: string[]): void;
}>();

const mode = ref("split");

const content = computed({
  get: () => props.modelValue,
  set: (newValue) => {
    emit("update:modelValue", newValue);
  },
});

// 图片上传处理（保持与原接口一致，供粘贴/自定义上传使用）
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
      Object.keys(fields || {}).forEach((k) => formData.append(k, fields[k]));
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

// 供 md-editor-v3 的上传钩子使用
const handleUploadImg = async (files, callback) => {
  const urls = await uploadImages(files);
  if (Array.isArray(urls) && urls.length > 0) {
    callback(urls);
    emit("upload-success", urls);
  }
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

/* md-editor-v3 编辑器样式覆盖 */
:deep(.md-editor) {
  height: 500px;
}

:deep(.md-editor .md-editor-preview) {
  background: #fafafa;
}
</style>
