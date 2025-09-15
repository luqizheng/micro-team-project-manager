<template>
  <div class="issue-detail-container">
    <!-- 页面头部 -->
    <div class="issue-header">
      <div class="issue-title-section">
        <h1 class="issue-title">
          <span class="issue-id">#{{issue.key}}</span>
          <div v-if="!isEditingTitle" class="title-display">
            <span class="issue-title-text">{{ issue.title }}</span>
            <a-button
              v-if="canEditTitle"
              size="small"
              type="text"
              @click="startEditTitle"
              class="edit-title-btn"
            >
              <EditOutlined />
            </a-button>
          </div>
          <div v-else class="title-edit">
            <a-input
              v-model:value="editingTitle"
              placeholder="请输入标题"
              :maxlength="140"
              @pressEnter="saveTitle"
              @blur="handleTitleBlur"
              ref="titleInput"
              class="title-input"
            />
            <div class="title-edit-actions">
              <a-button size="small" @click="cancelEditTitle">取消</a-button>
              <a-button size="small" type="primary" @click="saveTitle" :loading="savingTitle">
                保存
              </a-button>
            </div>
          </div>
        </h1>
        <div class="issue-meta">
          <a-tag :color="getTypeColor(issue.type)" class="issue-type-tag">
            {{ issue.type }}
          </a-tag>
          <StateSelector
            v-if="canTransition"
            v-model="issue.state"
            :project-id="projectId"
            :issue-type="issue.type"
            placeholder="请选择状态"
            @change="handleStateChange"
            class="state-selector"
          />
          <a-tag v-else :color="getStateColor(issue.state)" class="state-tag">
            {{ issue.state }}
          </a-tag>
          <a-button
            v-if="canSyncToGitLab"
            size="small"
            type="primary"
            :loading="syncingToGitLab"
            @click="syncToGitLab"
            class="sync-button"
          >
            <SyncOutlined />
            同步
          </a-button>
        </div>
      </div>
    </div>

    <a-row :gutter="[16, 16]">
      <!-- 主要内容区域 -->
      <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <!-- 基本信息卡片 -->
        <a-card size="small" class="info-card" :bordered="false">
          <a-row :gutter="[16, 8]">
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">负责人</span>
                <UserSelector
                  v-model="issue.assigneeId"
                  :project-id="projectId"
                  placeholder="未分配"
                  @change="handleAssigneeChange"
                  size="small"
                />
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">报告人</span>
                <UserSelector
                  v-model="issue.reporterId"
                  :project-id="projectId"
                  placeholder="未指定"
                  @change="handleReporterChange"
                  size="small"
                />
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(issue.createdAt) }}</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">更新时间</span>
                <span class="info-value">{{ formatDate(issue.updatedAt) }}</span>
              </div>
            </a-col>
            <a-col v-if="issue.type === 'task'" :span="12">
              <div class="info-item">
                <span class="info-label">预估工时</span>
                <span class="info-value">{{ issue.estimatedHours || "-" }} 小时</span>
              </div>
            </a-col>
            <a-col v-if="issue.type === 'task'" :span="12">
              <div class="info-item">
                <span class="info-label">实际工时</span>
                <span class="info-value">{{ issue.actualHours || "-" }} 小时</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">故事点</span>
                <a-input-number
                  v-model:value="issue.storyPoints"
                  :min="0"
                  :max="100"
                  placeholder="未设置"
                  size="small"
                  style="width: 100px"
                  @change="handleStoryPointsChange"
                />
              </div>
            </a-col>
          </a-row>
        </a-card>

        <!-- 描述区域 -->
        <a-card size="small" class="description-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <span>描述</span>
              <a-button
                v-if="canEditDescription && !isEditingDescription"
                size="small"
                type="text"
                @click="startEdit"
                class="edit-btn"
              >
                <EditOutlined />
                编辑
              </a-button>
            </div>
          </template>
          <div class="issue-description">
            <ByteMDEditor
              v-model="issue.description"
              placeholder="请输入事项描述（支持Markdown格式）"
              :max-length="10000"
              :project-id="projectId"
              :issue-id="issueId"
              :edit="isEditingDescription"
            />
            <div v-if="isEditingDescription" class="editor-actions">
              <a-button size="small" @click="cancelEdit">取消</a-button>
              <a-button size="small" type="primary" @click="saveEdit" :loading="saving">
                保存
              </a-button>
            </div>
          </div>
        </a-card>

        <!-- 子任务区域 -->
        <a-card v-if="children.length > 0" size="small" class="children-card" :bordered="false">
          <template #title>子任务 ({{ children.length }})</template>
          <a-table
            :columns="childColumns"
            :data-source="children"
            :pagination="false"
            size="small"
            row-key="id"
            class="children-table"
          >
            <template #title="{ record }">
              <a
                @click="() => router.push(`/projects/${projectId}/issues/${record.id}`)"
                class="child-title-link"
              >
                {{ record.title }}
              </a>
            </template>
            <template #assignee="{ record }">
              <span v-if="record.assigneeName" class="assignee-name">{{ record.assigneeName }}</span>
              <span v-else class="text-muted">未分配</span>
            </template>
            <template #state="{ record }">
              <a-tag :color="getStateColor(record.state)" size="small">
                {{ record.state }}
              </a-tag>
            </template>
          </a-table>
        </a-card>

        <!-- 评论区域 -->
        <a-card size="small" class="comments-card" :bordered="false">
          <template #title>评论 ({{ comments.length }})</template>
          <a-list :data-source="comments" item-layout="vertical" size="small">
            <template #renderItem="{ item }">
              <a-list-item class="comment-item">
                <a-comment>
                  <template #author>
                    <span class="comment-author">{{
                      item.author?.name ||
                      item.author?.email ||
                      item.authorId ||
                      "匿名"
                    }}</span>
                  </template>
                  <template #datetime>
                    <span class="comment-datetime">{{ formatDate(item.createdAt) }}</span>
                  </template>
                  <template #content>
                    <div class="comment-content">{{ item.body || item.content }}</div>
                  </template>
                </a-comment>
              </a-list-item>
            </template>
          </a-list>

          <a-divider class="comment-divider" />
          
          <a-form :model="commentForm" @submit.prevent class="comment-form">
            <a-form-item class="comment-textarea-item">
              <a-textarea
                v-model:value="commentForm.content"
                placeholder="输入评论内容..."
                :rows="2"
                :disabled="!canComment"
                class="comment-textarea"
              />
            </a-form-item>
            <a-form-item class="comment-submit-item">
              <a-tooltip :title="!canComment ? '无权限添加评论' : ''">
                <a-button
                  type="primary"
                  size="small"
                  @click="addComment"
                  :loading="commentLoading"
                  :disabled="!canComment"
                >
                  添加评论
                </a-button>
              </a-tooltip>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <!-- 侧边栏 -->
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card size="small" class="attachments-card" :bordered="false">
          <template #title>
            <span>附件 ({{ attachments.length }})</span>
          </template>
          <div class="upload-section">
            <a-upload
              :file-list="fileList"
              :before-upload="beforeUpload"
              :custom-request="customUpload"
              :show-upload-list="false"
            >
              <a-button size="small" block>
                <upload-outlined />
                上传附件
              </a-button>
            </a-upload>
          </div>

          <a-list
            :data-source="attachments"
            size="small"
            class="attachments-list"
          >
            <template #renderItem="{ item }">
              <a-list-item class="attachment-item">
                <a-list-item-meta>
                  <template #title>
                    <a :href="item.url" target="_blank" class="attachment-link">
                      {{ item.fileName }}
                    </a>
                  </template>
                  <template #description>
                    <span class="attachment-meta">
                      {{ formatFileSize(item.size) }} - {{ formatDate(item.createdAt) }}
                    </span>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { UploadOutlined, EditOutlined, SyncOutlined } from "@ant-design/icons-vue";
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

// 标题编辑状态管理
const isEditingTitle = ref(false);
const editingTitle = ref("");
const originalTitle = ref("");
const savingTitle = ref(false);
const canEditTitle = computed(() =>
  auth.hasAnyRole(["admin", "project_manager", "member"])
);

// GitLab 同步状态管理
const syncingToGitLab = ref(false);
const canSyncToGitLab = computed(() =>
  auth.hasAnyRole(["admin", "project_manager", "member"])
);

// Markdown 渲染已移除，使用 ByteMDEditor 组件处理

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

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    bug: "red",
    task: "blue",
    story: "green",
    epic: "purple",
  };
  return colors[type] || "default";
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
    // 后端完全代理上传
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("issueId", issueId);
    formData.append("file", file);
    const uploadApiRes = await fetch(`/attachments/upload`, { method: "POST", body: formData });
    if (!uploadApiRes.ok) throw new Error("上传失败");

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

// 处理标题变化
async function handleTitleChange(value: string) {
  try {
    await http.put(`/projects/${projectId}/issues/${issueId}`, {
      title: value,
    });
    issue.value.title = value;
    message.success("标题更新成功");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "标题更新失败");
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

// 标题编辑相关方法
function startEditTitle() {
  originalTitle.value = issue.value.title || "";
  editingTitle.value = issue.value.title || "";
  isEditingTitle.value = true;
  // 下一个tick聚焦输入框
  nextTick(() => {
    const input = document.querySelector('.title-input input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

async function saveTitle() {
  if (!editingTitle.value.trim()) {
    message.warning("请输入标题");
    return;
  }
  
  if (editingTitle.value === originalTitle.value) {
    isEditingTitle.value = false;
    return;
  }

  savingTitle.value = true;
  try {
    await handleTitleChange(editingTitle.value);
    isEditingTitle.value = false;
  } catch (e: any) {
    message.error(e?.response?.data?.message || "保存失败");
    // 保持编辑状态，让用户可以重试
  } finally {
    savingTitle.value = false;
  }
}

function cancelEditTitle() {
  editingTitle.value = originalTitle.value;
  isEditingTitle.value = false;
}

function handleTitleBlur() {
  // 延迟处理，避免与点击保存按钮冲突
  setTimeout(() => {
    if (isEditingTitle.value && !savingTitle.value) {
      // 如果内容没有变化，直接取消编辑
      if (editingTitle.value === originalTitle.value) {
        cancelEditTitle();
      }
    }
  }, 200);
}

// 同步到 GitLab
async function syncToGitLab() {
  if (syncingToGitLab.value) return;
  
  syncingToGitLab.value = true;
  try {
    const response = await http.post(`/projects/${projectId}/issues/${issueId}/sync-to-gitlab`, {
      issueId: issueId,
      projectId: projectId
    });
    
    if (response.data.success) {
      message.success("同步到 GitLab 成功");
    } else {
      message.error(response.data.message || "同步失败");
    }
  } catch (e: any) {
    console.error("同步到 GitLab 失败:", e);
    message.error(e?.response?.data?.message || "同步到 GitLab 失败");
  } finally {
    syncingToGitLab.value = false;
  }
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
/* 主容器 */
.issue-detail-container {
  padding: 0;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 页面头部 */
.issue-header {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.issue-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.issue-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  line-height: 1.4;
  flex: 1;
}

.issue-id {
  color: #8c8c8c;
  font-weight: 400;
  margin-right: 8px;
}

.issue-title-text {
  color: #262626;
}

.title-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.edit-title-btn {
  color: #8c8c8c;
  padding: 0;
  height: auto;
  opacity: 0;
  transition: opacity 0.2s;
}

.title-display:hover .edit-title-btn {
  opacity: 1;
}

.title-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.title-input {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.title-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.issue-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.issue-type-tag {
  font-weight: 500;
}

.state-selector {
  min-width: 120px;
}

.state-tag {
  font-weight: 500;
}

.sync-button {
  margin-left: 8px;
}

/* 卡片样式 */
.info-card,
.description-card,
.children-card,
.comments-card,
.attachments-card {
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #262626;
}

.edit-btn {
  color: #1890ff;
  padding: 0;
  height: auto;
}

/* 信息项样式 */
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.info-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

/* 描述区域 */
.issue-description {
  margin-top: 8px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-radius: 0 0 6px 6px;
}

/* 子任务表格 */
.children-table {
  margin-top: 8px;
}

.child-title-link {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
}

.child-title-link:hover {
  text-decoration: underline;
}

.assignee-name {
  font-weight: 500;
  color: #262626;
}

.text-muted {
  color: #8c8c8c;
  font-style: italic;
}

/* 评论区域 */
.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-author {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.comment-datetime {
  color: #8c8c8c;
  font-size: 12px;
}

.comment-content {
  margin-top: 4px;
  color: #595959;
  line-height: 1.6;
  white-space: pre-wrap;
}

.comment-divider {
  margin: 16px 0 12px 0;
}

.comment-form {
  margin-top: 8px;
}

.comment-textarea-item {
  margin-bottom: 8px;
}

.comment-textarea {
  resize: vertical;
  min-height: 60px;
}

.comment-submit-item {
  margin-bottom: 0;
  text-align: right;
}

/* 附件区域 */
.upload-section {
  margin-bottom: 16px;
}

.attachments-list {
  max-height: 300px;
  overflow-y: auto;
}

.attachment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-link {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
}

.attachment-link:hover {
  text-decoration: underline;
}

.attachment-meta {
  color: #8c8c8c;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .issue-header {
    padding: 12px 16px;
  }
  
  .issue-title {
    font-size: 20px;
  }
  
  .issue-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .issue-meta {
    width: 100%;
    justify-content: flex-start;
  }
  
  .info-item {
    margin-bottom: 12px;
  }
}

/* Markdown 预览样式优化 */
:deep(.markdown-preview) {
  min-height: 80px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
  line-height: 1.6;
}

:deep(.markdown-preview .empty-content) {
  color: #8c8c8c;
  font-style: italic;
}

:deep(.markdown-preview h1),
:deep(.markdown-preview h2),
:deep(.markdown-preview h3),
:deep(.markdown-preview h4),
:deep(.markdown-preview h5),
:deep(.markdown-preview h6) {
  margin-top: 12px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #262626;
}

:deep(.markdown-preview p) {
  margin-bottom: 6px;
  color: #595959;
}

:deep(.markdown-preview ul),
:deep(.markdown-preview ol) {
  margin-bottom: 6px;
  padding-left: 20px;
}

:deep(.markdown-preview li) {
  margin-bottom: 3px;
  color: #595959;
}

:deep(.markdown-preview blockquote) {
  margin: 6px 0;
  padding: 8px 12px;
  background: #f6f8fa;
  border-left: 3px solid #d9d9d9;
  color: #595959;
  border-radius: 0 4px 4px 0;
}

:deep(.markdown-preview code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 85%;
  color: #d73a49;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

:deep(.markdown-preview pre) {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 6px 0;
  border: 1px solid #e1e4e8;
}

:deep(.markdown-preview pre code) {
  background: none;
  padding: 0;
  color: #24292e;
}

:deep(.markdown-preview table) {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0;
  font-size: 14px;
}

:deep(.markdown-preview th),
:deep(.markdown-preview td) {
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  text-align: left;
}

:deep(.markdown-preview th) {
  background: #f6f8fa;
  font-weight: 600;
  color: #24292e;
}
</style>
