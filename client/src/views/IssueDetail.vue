<template>
  <a-card :title="`事项 #${issue.id} - ${issue.title}`" :bordered="false">
    <a-row :gutter="16">
      <a-col :span="16">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="类型">{{
            issue.type
          }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <StateSelector
              v-if="canTransition"
              v-model="issue.state"
              :project-id="projectId"
              :issue-type="issue.type"
              placeholder="请选择状态"
              @change="handleStateChange"
            />
            <a-tag v-else :color="getStateColor(issue.state)">{{
              issue.state
            }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="负责人">
            <UserSelector
              v-model="issue.assigneeId"
              :project-id="projectId"
              placeholder="未分配"
              @change="handleAssigneeChange"
            />
          </a-descriptions-item>
          <a-descriptions-item label="报告人">
            <UserSelector
              v-model="issue.reporterId"
              :project-id="projectId"
              placeholder="未指定"
              @change="handleReporterChange"
            />
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{
            formatDate(issue.createdAt)
          }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{
            formatDate(issue.updatedAt)
          }}</a-descriptions-item>
          <a-descriptions-item v-if="issue.type === 'task'" label="预估工时"
            >{{ issue.estimatedHours || "-" }} 小时</a-descriptions-item
          >
          <a-descriptions-item v-if="issue.type === 'task'" label="实际工时"
            >{{ issue.actualHours || "-" }} 小时</a-descriptions-item
          >
          <a-descriptions-item label="故事点">
            <a-input-number
              v-model:value="issue.storyPoints"
              :min="0"
              :max="100"
              placeholder="未设置"
              size="small"
              style="width: 120px"
              @change="handleStoryPointsChange"
            />
          </a-descriptions-item>
        </a-descriptions>

        <a-divider>
          <div class="description-header">
            <span>描述</span>
            <a-button
              v-if="canEditDescription && !isEditingDescription"
              size="small"
              type="text"
              @click="startEdit"
            >
              <EditOutlined />
              编辑
            </a-button>
          </div>
        </a-divider>

        <div class="issue-description">
          <!-- 编辑模式 -->
          <div class="markdown-editor">
            <ByteMDEditor
              v-model="issue.description"
              placeholder="请输入事项描述（支持Markdown格式）"
              :max-length="10000"
              :project-id="projectId"
              :issue-id="issueId"
              :edit="isEditingDescription"
            />
            <div class="editor-actions">
              <a-button @click="cancelEdit">取消</a-button>
              <a-button type="primary" @click="saveEdit" :loading="saving"
                >保存</a-button
              >
            </div>
          </div>
        </div>

        <a-divider v-if="children.length > 0">子任务</a-divider>
        <a-table
          v-if="children.length > 0"
          :columns="childColumns"
          :data-source="children"
          :pagination="false"
          size="small"
          row-key="id"
        >
          <template #title="{ record }">
            <a
              @click="
                () => router.push(`/projects/${projectId}/issues/${record.id}`)
              "
              >{{ record.title }}</a
            >
          </template>
          <template #assignee="{ record }">
            <span v-if="record.assigneeName">{{ record.assigneeName }}</span>
            <span v-else class="text-muted">未分配</span>
          </template>
          <template #state="{ record }">
            <a-tag :color="getStateColor(record.state)">{{
              record.state
            }}</a-tag>
          </template>
        </a-table>

        <a-divider>评论</a-divider>
        <a-list :data-source="comments" item-layout="vertical">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-comment>
                <template #author>{{
                  item.author?.name ||
                  item.author?.email ||
                  item.authorId ||
                  "匿名"
                }}</template>
                <template #datetime>{{ formatDate(item.createdAt) }}</template>
                <template #content>
                  <p>{{ item.body || item.content }}</p>
                </template>
              </a-comment>
            </a-list-item>
          </template>
        </a-list>

        <a-divider>添加评论</a-divider>
        <a-form :model="commentForm" @submit.prevent>
          <a-form-item>
            <a-textarea
              v-model:value="commentForm.content"
              placeholder="输入评论内容"
              :rows="3"
              :disabled="!canComment"
            />
          </a-form-item>
          <a-form-item>
            <a-tooltip :title="!canComment ? '无权限添加评论' : ''">
              <a-button
                type="primary"
                @click="addComment"
                :loading="commentLoading"
                :disabled="!canComment"
                >添加评论</a-button
              >
            </a-tooltip>
          </a-form-item>
        </a-form>
      </a-col>

      <a-col :span="8">
        <a-card title="附件" size="small">
          <a-upload
            :file-list="fileList"
            :before-upload="beforeUpload"
            :custom-request="customUpload"
            :show-upload-list="true"
          >
            <a-button>
              <upload-outlined />
              上传附件
            </a-button>
          </a-upload>

          <a-list
            :data-source="attachments"
            size="small"
            style="margin-top: 16px"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a :href="item.url" target="_blank">{{ item.fileName }}</a>
                  </template>
                  <template #description>
                    {{ formatFileSize(item.size) }} -
                    {{ formatDate(item.createdAt) }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { UploadOutlined, EditOutlined } from "@ant-design/icons-vue";
import { marked } from "marked";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import UserSelector from "../components/UserSelector.vue";
import ByteMDEditor from "../components/ByteMDEditor.vue";
import StateSelector from "../components/StateSelector.vue";

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;
const issueId = route.params.issueId as string;
const auth = useAuthStore();

const issue = ref<any>({});
const comments = ref<any[]>([]);
const attachments = ref<any[]>([]);
const fileList = ref<any[]>([]);
const commentLoading = ref(false);
const commentForm = reactive({ content: "" });
const children = ref<any[]>([]);

const availableStates = ref<any[]>([]);
const canTransition = computed(() =>
  auth.hasAnyRole(["admin", "project_manager", "member"])
);
const canComment = computed(() => auth.isAuthenticated);

// 描述编辑状态管理
const isEditingDescription = ref(false);
const originalDescription = ref("");
const saving = ref(false);
const canEditDescription = computed(() =>
  auth.hasAnyRole(["admin", "project_manager", "member"])
);

// Markdown 渲染
const renderedMarkdown = computed(() => {
  if (!issue.value.description) {
    return '<p class="empty-content">暂无描述</p>';
  }
  return marked(issue.value.description);
});

const childColumns = [
  {
    title: "标题",
    dataIndex: "title",
    key: "title",
    slots: { customRender: "title" },
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "状态",
    dataIndex: "state",
    key: "state",
    slots: { customRender: "state" },
  },
  {
    title: "负责人",
    dataIndex: "assigneeId",
    key: "assignee",
    slots: { customRender: "assignee" },
  },
  { title: "预估(小时)", dataIndex: "estimatedHours" },
  { title: "实际(小时)", dataIndex: "actualHours" },
];

function getStateColor(state: string) {
  const colors: Record<string, string> = {
    open: "blue",
    in_progress: "orange",
    resolved: "green",
    closed: "red",
  };
  return colors[state] || "default";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function loadIssue() {
  try {
    const res = await http.get(`/projects/${projectId}/issues/${issueId}`);
    issue.value = res.data.data;
  } catch (e: any) {
    message.error(e?.response?.data?.message || "加载失败");
  }
}

async function loadChildren() {
  try {
    const res = await http.get(`/projects/${projectId}/issues`, {
      params: {
        parentId: issueId,
        page: 1,
        pageSize: 1000,
      },
    });
    children.value = res.data.data?.items || [];
  } catch (e: any) {
    message.error("加载子任务失败");
    children.value = [];
  }
}

async function loadAvailableStates() {
  try {
    const res = await http.get(
      `/projects/${projectId}/issues/states/${issue.value.type}`
    );
    availableStates.value = res.data.data || [];
  } catch (e: any) {
    message.error("加载状态列表失败");
    availableStates.value = [];
  }
}

async function loadComments() {
  try {
    const res = await http.get(
      `/projects/${projectId}/issues/${issueId}/comments`
    );
    comments.value = res.data.data || [];
  } catch (e: any) {
    message.error("加载评论失败");
  }
}

async function loadAttachments() {
  try {
    const res = await http.get(`/attachments/issues/${issueId}`);
    attachments.value = res.data.data || [];
  } catch (e: any) {
    message.error("加载附件失败");
  }
}

async function changeState(newState: string) {
  try {
    await http.post(`/projects/${projectId}/issues/${issueId}/transition`, {
      to: newState,
    });
    issue.value.state = newState;
    message.success("状态更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "状态更新失败");
  }
}

async function addComment() {
  if (!commentForm.content.trim()) {
    message.warning("请输入评论内容");
    return;
  }
  commentLoading.value = true;
  try {
    await http.post(`/projects/${projectId}/issues/${issueId}/comments`, {
      body: commentForm.content,
      authorId: String(auth.user?.id || ""),
    });
    commentForm.content = "";
    await loadComments();
    message.success("评论添加成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "评论添加失败");
  } finally {
    commentLoading.value = false;
  }
}

function beforeUpload(file: any) {
  const isValidSize = file.size / 1024 / 1024 < 10; // 10MB
  if (!isValidSize) {
    message.error("文件大小不能超过 10MB");
    return false;
  }
  return true;
}

async function customUpload(options: any) {
  const { file } = options;
  try {
    // 获取预签名上传URL
    const objectKey = `${projectId}/${issueId}/${Date.now()}-${encodeURIComponent(
      file.name
    )}`;
    const res = await http.post(`/attachments/presign`, {
      key: objectKey,
      contentType: file.type,
    });

    const { url, fields } = res.data.data || res.data;

    // 使用表单直传（S3兼容）
    const formData = new FormData();
    Object.keys(fields || {}).forEach((k) => formData.append(k, fields[k]));
    formData.append("file", file);
    const uploadRes = await fetch(url, { method: "POST", body: formData });

    if (!uploadRes.ok) {
      throw new Error("上传失败");
    }

    // 记录附件信息
    await http.post(`/attachments/issues/${issueId}/record`, {
      objectKey,
      fileName: file.name,
      size: file.size,
      contentType: file.type,
    });

    message.success("附件上传成功");
    await loadAttachments();
  } catch (e: any) {
    message.error(e?.response?.data?.message || "附件上传失败");
  }
}

// 处理负责人变化
async function handleAssigneeChange(value: string | undefined) {
  try {
    await http.put(`/projects/${projectId}/issues/${issueId}`, {
      assigneeId: value,
    });
    issue.value.assigneeId = value;
    message.success("负责人更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "负责人更新失败");
    // 恢复原值
    await loadIssue();
  }
}

// 处理报告人变化
async function handleReporterChange(value: string | undefined) {
  try {
    await http.put(`/projects/${projectId}/issues/${issueId}`, {
      reporterId: value,
    });
    issue.value.reporterId = value;
    message.success("报告人更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "报告人更新失败");
    // 恢复原值
    await loadIssue();
  }
}

// 处理描述变化
async function handleDescriptionChange(value: string) {
  try {
    await http.put(`/projects/${projectId}/issues/${issueId}`, {
      description: value,
    });
    issue.value.description = value;
    message.success("描述更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "描述更新失败");
    // 恢复原值
    await loadIssue();
  }
}

// 处理故事点变化
async function handleStoryPointsChange(value: number | null) {
  try {
    await http.put(`/projects/${projectId}/issues/${issueId}`, {
      storyPoints: value,
    });
    issue.value.storyPoints = value;
    message.success("故事点更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "故事点更新失败");
    // 恢复原值
    await loadIssue();
  }
}

// 处理状态变化
async function handleStateChange(value: string | undefined) {
  if (!value) return;

  try {
    await changeState(value);
    // changeState方法已经更新了issue.value.state和显示成功消息
  } catch (e: any) {
    // 恢复原值
    await loadIssue();
  }
}

// 描述编辑相关方法
function startEdit() {
  originalDescription.value = issue.value.description || "";
  isEditingDescription.value = true;
}

async function saveEdit() {
  saving.value = true;
  try {
    await handleDescriptionChange(issue.value.description);
    isEditingDescription.value = false;
    message.success("描述更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "保存失败");
    // 保持编辑状态，让用户可以重试
  } finally {
    saving.value = false;
  }
}

function cancelEdit() {
  issue.value.description = originalDescription.value;
  isEditingDescription.value = false;
}

onMounted(async () => {
  await loadIssue();
  await Promise.all([
    loadComments(),
    loadAttachments(),
    loadChildren(),
    loadAvailableStates(),
  ]);
});
</script>

<style scoped>
.issue-description {
  margin-bottom: 16px;
}

.description-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.description-header span {
  font-weight: 500;
  color: #262626;
}

.markdown-preview {
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  line-height: 1.6;
}

.markdown-preview :deep(.empty-content) {
  color: #8c8c8c;
  font-style: italic;
}

.markdown-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

/* Markdown 预览样式 */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #262626;
}

.markdown-preview :deep(p) {
  margin-bottom: 8px;
  color: #595959;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-bottom: 8px;
  padding-left: 20px;
}

.markdown-preview :deep(li) {
  margin-bottom: 4px;
  color: #595959;
}

.markdown-preview :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 16px;
  background: #f6f8fa;
  border-left: 4px solid #d9d9d9;
  color: #595959;
}

.markdown-preview :deep(code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 85%;
  color: #d73a49;
}

.markdown-preview :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: #24292e;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: #fafafa;
  font-weight: 600;
}
</style>
