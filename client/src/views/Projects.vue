<template>
  <div class="projects-page">
    <div class="page-header">
      <div class="header-content">
        <div class="page-title">
          <div class="title-icon">
            <FolderOutlined />
          </div>
          <div class="title-text">
            <h1>项目管理</h1>
            <p>管理和跟踪您的项目进度</p>
          </div>
        </div>
        <div class="header-actions">
          <a-tooltip :title="!canManageProject ? '无权限创建项目' : ''">
            <a-button
              type="primary"
              size="large"
              :disabled="!canManageProject"
              @click="openCreate"
              class="create-btn"
            >
              <template #icon>
                <PlusOutlined />
              </template>
              新建项目
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </div>

    <a-card class="projects-card" :bordered="false">
      <div class="search-section">
        <div class="search-bar">
          <a-input
            v-model:value="q"
            placeholder="搜索项目名称或KEY..."
            allow-clear
            class="search-input"
            size="large"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-select
            v-model:value="visibility"
            placeholder="可见性"
            allow-clear
            class="visibility-select"
            size="large"
          >
            <a-select-option value="private">
              <template #icon>
                <LockOutlined />
              </template>
              Private
            </a-select-option>
            <a-select-option value="public">
              <template #icon>
                <GlobalOutlined />
              </template>
              Public
            </a-select-option>
          </a-select>
          <a-button type="primary" size="large" @click="load" class="search-btn">
            <template #icon>
              <SearchOutlined />
            </template>
            搜索
          </a-button>
        </div>
      </div>
      <div class="table-section">
        <a-table
          :columns="columns"
          :data-source="items"
          :pagination="pagination"
          :loading="loading"
          row-key="id"
          class="projects-table"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'key'">
              <div class="project-key">
                <a-tag color="blue" class="key-tag">{{ record.key }}</a-tag>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'name'">
              <div class="project-name">
                <a class="name-text" @click="goDetail(record)">{{ record.name }}</a>
                <div v-if="record.description" class="name-desc">{{ record.description }}</div>
              </div>
            </template>
            <template v-else-if="column.key === 'visibility'">
              <a-tag :color="record.visibility === 'public' ? 'green' : 'orange'" class="visibility-tag">
                <template #icon>
                  <GlobalOutlined v-if="record.visibility === 'public'" />
                  <LockOutlined v-else />
                </template>
                {{ record.visibility === 'public' ? 'Public' : 'Private' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="action-buttons">
                <a-dropdown>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item key="detail" @click="goDetail(record)">
                        <EyeOutlined />
                        查看详情
                      </a-menu-item>
                      <a-menu-item key="issues" @click="goIssues(record)">
                        <BugOutlined />
                        事项管理
                      </a-menu-item>
                      <a-menu-item key="kanban" @click="goKanban(record)">
                        <AppstoreOutlined />
                        看板视图
                      </a-menu-item>
                      <a-menu-item key="hours" @click="goHours(record)">
                        <ClockCircleOutlined />
                        工时报表
                      </a-menu-item>
                      <a-menu-item key="releases" @click="goReleases(record)">
                        <RocketOutlined />
                        发布管理
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item 
                        key="edit" 
                        :disabled="!canManageProject"
                        @click="canManageProject && edit(record)"
                      >
                        <EditOutlined />
                        编辑项目
                      </a-menu-item>
                      <a-menu-item 
                        key="archive" 
                        :disabled="!canManageProject"
                        @click="canManageProject && toggleArchive(record)"
                      >
                        <InboxOutlined />
                        {{ record.archived ? "取消归档" : "归档项目" }}
                      </a-menu-item>
                      <a-menu-item 
                        key="delete" 
                        :disabled="!canManageProject"
                        @click="canManageProject && removeProject(record)"
                        class="danger-item"
                      >
                        <DeleteOutlined />
                        删除项目
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button type="text" class="action-btn">
                    操作
                  </a-button>
                </a-dropdown>
              </div>
            </template>
          </template>
          <template #emptyText>
            <div class="empty-state">
              <div class="empty-icon">
                <FolderOpenOutlined />
              </div>
              <div class="empty-title">暂无项目</div>
              <div class="empty-desc">开始创建您的第一个项目</div>
              <a-button type="primary" @click="openCreate" :disabled="!canManageProject">
                <template #icon>
                  <PlusOutlined />
                </template>
                创建项目
              </a-button>
            </div>
          </template>
        </a-table>
      </div>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :title="modalMode === 'create' ? '新建项目' : '编辑项目'"
      :confirm-loading="saveLoading"
      @ok="save"
      @cancel="closeModal"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="KEY" v-if="modalMode === 'create'" required>
          <a-input
            v-model:value="form.key"
            placeholder="例如: PM"
            maxlength="20"
          />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input
            v-model:value="form.name"
            placeholder="项目名称"
            maxlength="80"
          />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="form.visibility" style="width: 160px">
            <a-select-option value="private">private</a-select-option>
            <a-select-option value="public">public</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
 </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import http from "../api/http";
import { useLoading } from "../composables/useLoading";
import { message } from "ant-design-vue";
import { useAuthStore } from "../stores/auth";
import { 
  FolderOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  LockOutlined, 
  GlobalOutlined,
  EyeOutlined,
  BugOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  EditOutlined,
  InboxOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";

const { loading, withLoading } = useLoading();
const auth = useAuthStore();
const canManageProject = computed(() => auth.hasAnyRole(["project_admin","admin"]));

const items = ref<any[]>([]);
const q = ref("");
const visibility = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<"ascend" | "descend" | undefined>(undefined);

const router = useRouter();

const columns = [
  { title: "名称", dataIndex: "name", sorter: true },
  { title: "可见性", dataIndex: "visibility" },
  { title: "操作", key: "action" },
];

async function load() {
  await withLoading(async () => {
    try {
      const { current, pageSize } = pagination.value as any;
      const res = await http.get("/projects", {
        params: {
          page: current,
          pageSize,
          q: q.value,
          visibility: visibility.value,
          sortField: sortField.value,
          sortOrder:
            sortOrder.value === "ascend"
              ? "ASC"
              : sortOrder.value === "descend"
              ? "DESC"
              : undefined,
        },
      });
      items.value = res.data.data.items;
      pagination.value.total = res.data.data.total;
    } catch (e) {
      message.error("加载项目失败");
    }
  });
}

function onTableChange(p: any, _filters: any, sorter: any) {
  pagination.value = {
    ...pagination.value,
    current: p.current,
    pageSize: p.pageSize,
  } as any;
  if (Array.isArray(sorter)) {
    const s = sorter[0] || {};
    sortField.value = s.field;
    sortOrder.value = s.order;
  } else {
    sortField.value = sorter?.field;
    sortOrder.value = sorter?.order;
  }
  load();
}

onMounted(load);

function goDetail(record: any) {
  router.push(`/projects/${record.id}`);
}
function goIssues(record: any) {
  router.push(`/projects/${record.id}/issues`);
}
function goNewIssue(record: any) {
  console.log(`redirect to /projects/${record.id}/issues/new`);
  router.push(`/projects/${record.id}/issues/new`);
}
function goHours(record: any) {
  router.push(`/projects/${record.id}/reports/hours`);
}
function goReleases(record: any) {
  router.push(`/projects/${record.id}/releases`);
}
function goKanban(record: any) {
  router.push(`/projects/${record.id}/kanban`);
}

// CRUD 相关
const modalOpen = ref(false);
const modalMode = ref<"create" | "edit">("create");
const saveLoading = ref(false);
const form = ref<{
  id?: string;
  key: string;
  name: string;
  visibility?: "private" | "public";
}>({ key: "", name: "", visibility: "private" });

function openCreate() {
  modalMode.value = "create";
  form.value = { key: "", name: "", visibility: "private" };
  modalOpen.value = true;
}

function edit(record: any) {
  
  modalMode.value = "edit";
  form.value = {
    id: record.id,
    key: record.key,
    name: record.name,
    visibility: record.visibility,
  };
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

async function save() {
  saveLoading.value = true;
  try {
    if (modalMode.value === "create") {
      await http.post("/projects", {
        key: form.value.key?.toUpperCase(),
        name: form.value.name,
        visibility: form.value.visibility,
      });
    } else if (form.value.id) {
      await http.patch(`/projects/${form.value.id}`, {
        name: form.value.name,
        visibility: form.value.visibility,
      });
    }
    closeModal();
    await load();
  } finally {
    saveLoading.value = false;
  }
}

async function toggleArchive(record: any) {
  await withLoading(async () => {
    await http.patch(`/projects/${record.id}`, { archived: !record.archived });
    await load();
  });
}

async function removeProject(record: any) {
  // 简单确认
  if (!confirm(`确认删除项目 ${record.name} ?`)) return;
  await withLoading(async () => {
    await http.delete(`/projects/${record.id}`);
    await load();
  });
}
</script>

<style scoped>
/* 页面容器 */
.projects-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px 0;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.title-text h1 {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.title-text p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.create-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 卡片容器 */
.projects-card {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
  overflow: hidden;
  background: white;
}

/* 搜索区域 */
.search-section {
  padding: 24px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border-bottom: 1px solid #f0f0f0;
}

.search-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  max-width: 800px;
}

.search-input {
  flex: 1;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.visibility-select {
  min-width: 140px;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.visibility-select:focus {
  border-color: #667eea;
}

.search-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 表格区域 */
.table-section {
  padding: 0;
}

.projects-table {
  border: none;
}

.projects-table :deep(.ant-table-thead > tr > th) {
  background: #fafbfc;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 600;
  color: #333;
  padding: 16px;
}

.projects-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  transition: all 0.3s ease;
}

.projects-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8f9ff;
}

/* 项目KEY */
.project-key {
  display: flex;
  align-items: center;
}

.key-tag {
  font-weight: 600;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
}

/* 项目名称 */
.project-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  cursor: pointer;
  text-decoration: underline
}

.name-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 可见性标签 */
.visibility-tag {
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #666;
}

.action-btn:hover {
  background: #f0f2ff;
  color: #667eea;
  transform: scale(1.1);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
}

.empty-icon {
  font-size: 64px;
  color: #d9d9d9;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

/* 危险操作 */
.danger-item {
  color: #ff4d4f !important;
}

.danger-item:hover {
  background: #fff2f0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .search-bar {
    flex-direction: column;
    width: 100%;
  }
  
  .search-input,
  .visibility-select {
    width: 100%;
  }
  
  .projects-card {
    margin: 0 16px;
  }
  
  .search-section {
    padding: 16px;
  }
  
  .table-section {
    overflow-x: auto;
  }
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.projects-page {
  animation: slideInUp 0.6s ease-out;
}

/* 表格行动画 */
.projects-table :deep(.ant-table-tbody > tr) {
  animation: slideInUp 0.4s ease-out;
  animation-fill-mode: both;
}

.projects-table :deep(.ant-table-tbody > tr:nth-child(1)) { animation-delay: 0.1s; }
.projects-table :deep(.ant-table-tbody > tr:nth-child(2)) { animation-delay: 0.2s; }
.projects-table :deep(.ant-table-tbody > tr:nth-child(3)) { animation-delay: 0.3s; }
.projects-table :deep(.ant-table-tbody > tr:nth-child(4)) { animation-delay: 0.4s; }
.projects-table :deep(.ant-table-tbody > tr:nth-child(5)) { animation-delay: 0.5s; }
</style>
