<template>
  <div class="project-detail">
    <a-page-header
      :title="project?.name || '项目详情'"
      :sub-title="project?.key"
      @back="() => $router.push('/projects')"
    >
      <template #extra>
        <a-space>
          <a-button @click="goIssues">查看事项</a-button>
          <a-button type="primary" @click="goNewIssue">新建事项</a-button>
          <a-dropdown v-if="canManageProject">
            <template #overlay>
              <a-menu @click="({ key }) => handleMenuClick(key)">
                <a-menu-item key="edit">编辑项目</a-menu-item>
                <a-menu-item key="archive">
                  {{ project?.archived ? '取消归档' : '归档项目' }}
                </a-menu-item>
                <a-menu-item key="delete" class="danger-item">删除项目</a-menu-item>
              </a-menu>
            </template>
            <a-button>
              更多 <DownOutlined />
            </a-button>
          </a-dropdown>
        </a-space>
      </template>
    </a-page-header>

    <a-card v-if="project" class="project-info-card">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="项目KEY">
          <a-tag color="blue">{{ project.key }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="项目名称">
          {{ project.name }}
        </a-descriptions-item>
        <a-descriptions-item label="可见性">
          <a-tag :color="project.visibility === 'public' ? 'green' : 'orange'">
            {{ project.visibility === 'public' ? '公开' : '私有' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="project.archived ? 'red' : 'green'">
            {{ project.archived ? '已归档' : '活跃' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ formatDate(project.createdAt) }}
        </a-descriptions-item>
        <a-descriptions-item label="更新时间">
          {{ formatDate(project.updatedAt) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

  
    <a-card v-if="canManageProject " title="成员管理" class="member-card">
   
      <ProjectMemberManager :project-id="projectId" />
    </a-card>

    <!-- 编辑项目模态框 -->
    <a-modal
      v-model:open="editModalOpen"
      title="编辑项目"
      :confirm-loading="editLoading"
      @ok="handleEditProject"
      @cancel="resetEditForm"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input
            v-model:value="editForm.name"
            placeholder="项目名称"
            maxlength="80"
          />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="editForm.visibility" style="width: 160px">
            <a-select-option value="private">私有</a-select-option>
            <a-select-option value="public">公开</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue';
import http from '../api/http';
import { useLoading } from '../composables/useLoading';
import { useAuthStore } from '../stores/auth';
import ProjectMemberManager from '../components/ProjectMemberManager.vue';

interface Project {
  id: string;
  key: string;
  name: string;
  visibility: 'private' | 'public';
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

const route = useRoute();
const router = useRouter();
const { loading, withLoading } = useLoading();
const auth = useAuthStore();

const projectId = computed(() => route.params.projectId as string);
const canManageProject = computed(() => 
  auth.hasAnyRole(['admin', 'project_manager'])
);

const project = ref<Project | null>(null);
const editModalOpen = ref(false);
const editLoading = ref(false);
const editForm = ref({
  name: '',
  visibility: 'private' as 'private' | 'public',
});

// 加载项目详情
async function loadProject() {
  await withLoading(async () => {
    try {
      const res = await http.get(`/projects/${projectId.value}`);
      project.value = res.data.data;
    } catch (error: any) {
      message.error('加载项目详情失败');
      console.error('Load project error:', error);
    }
  });
}

// 编辑项目
function editProject() {
  if (!project.value) return;
  
  editForm.value = {
    name: project.value.name,
    visibility: project.value.visibility,
  };
  editModalOpen.value = true;
}

// 保存编辑
async function handleEditProject() {
  if (!project.value) return;

  editLoading.value = true;
  try {
    await http.patch(`/projects/${project.value.id}`, editForm.value);
    message.success('项目更新成功');
    editModalOpen.value = false;
    await loadProject();
  } catch (error: any) {
    message.error(error.response?.data?.message || '项目更新失败');
  } finally {
    editLoading.value = false;
  }
}

// 重置编辑表单
function resetEditForm() {
  editModalOpen.value = false;
}

// 菜单点击处理
function handleMenuClick(key: string) {
  switch (key) {
    case 'edit':
      editProject();
      break;
    case 'archive':
      toggleArchive();
      break;
    case 'delete':
      deleteProject();
      break;
  }
}

// 切换归档状态
async function toggleArchive() {
  if (!project.value) return;

  const action = project.value.archived ? '取消归档' : '归档';
  if (!confirm(`确认${action}项目 ${project.value.name}？`)) {
    return;
  }

  await withLoading(async () => {
    try {
      await http.patch(`/projects/${project.value!.id}`, {
        archived: !project.value!.archived,
      });
      message.success(`项目${action}成功`);
      await loadProject();
    } catch (error: any) {
      message.error(error.response?.data?.message || `项目${action}失败`);
    }
  });
}

// 删除项目
function deleteProject() {
  if (!project.value) return;

  Modal.confirm({
    title: '确认删除项目',
    content: `确定要删除项目 "${project.value.name}" 吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      await withLoading(async () => {
        try {
          await http.delete(`/projects/${project.value!.id}`);
          message.success('项目删除成功');
          router.push('/projects');
        } catch (error: any) {
          message.error(error.response?.data?.message || '项目删除失败');
        }
      });
    },
  });
}

// 导航到事项页面
function goIssues() {
  router.push(`/projects/${projectId.value}/issues`);
}

// 导航到新建事项页面
function goNewIssue() {
  router.push(`/projects/${projectId.value}/issues/new`);
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN');
}

onMounted(() => {
  loadProject();
});
</script>

<style scoped>
.project-detail {
  padding: 24px;
}

.project-info-card {
  margin-top: 16px;
}

.member-card {
  margin-top: 16px;
}

.danger-item {
  color: #ff4d4f;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
}
</style>