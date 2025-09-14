<template>
  <a-card title="发布管理" :bordered="false">
    <a-space style="margin-bottom: 16px" wrap>
      <a-input v-model:value="q" placeholder="搜索名称或标签" allow-clear style="width:240px" />
      <a-select v-model:value="released" placeholder="状态" allow-clear style="width:140px">
        <a-select-option :value="'released'">已发布</a-select-option>
        <a-select-option :value="'draft'">草稿</a-select-option>
      </a-select>
      <a-button type="primary" @click="load" :loading="loading">搜索</a-button>
      <a-button @click="showCreateModal" type="primary" ghost :disabled="!canManage">创建发布</a-button>
    </a-space>

    <a-table :columns="columns" :data-source="releases" :pagination="pagination" :loading="loading" row-key="id" @change="onTableChange">
      <template #releasedAt="{ record }">
        {{ record.releasedAt ? formatDate(record.releasedAt) : '-' }}
      </template>
      <template #createdAt="{ record }">
        {{ formatDate(record.createdAt) }}
      </template>
      <template #action="{ record }">
        <a-space>
          <a @click="viewRelease(record)">查看</a>
          <a v-if="!record.releasedAt" :class="{ 'ant-typography-disabled': !canManage }" @click="canManage && publishRelease(record)">发布</a>
        </a-space>
      </template>
      <template #emptyText>
        <div style="padding:12px;">
          <div style="color:#999;margin-bottom:8px">暂无发布</div>
          <a-button type="link" @click="load">重试</a-button>
        </div>
      </template>
    </a-table>

    <!-- 创建发布模态框 -->
    <a-modal v-model:open="createModalVisible" title="创建发布" @ok="createRelease" :confirm-loading="createLoading">
      <a-form :model="createForm" :label-col="{span: 6}" :wrapper-col="{span: 16}">
        <a-form-item label="名称" required>
          <a-input v-model:value="createForm.name" placeholder="如 2025.09 发布" />
        </a-form-item>
        <a-form-item label="标签" required>
          <a-input v-model:value="createForm.tag" placeholder="如 v1.0.0" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="createForm.notes" placeholder="发布说明（可选）" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 发布详情模态框 -->
    <a-modal v-model:open="detailModalVisible" title="发布详情" width="800px" :footer="null">
      <div v-if="selectedRelease">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="名称">{{ selectedRelease.name }}</a-descriptions-item>
          <a-descriptions-item label="标签">{{ selectedRelease.tag }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(selectedRelease.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="发布时间" v-if="selectedRelease.releasedAt">
            {{ formatDate(selectedRelease.releasedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="备注" :span="2">{{ selectedRelease.notes || '-' }}</a-descriptions-item>
        </a-descriptions>

        <a-divider>发布说明</a-divider>
        <div v-html="selectedRelease.notes" style="max-height: 400px; overflow-y: auto; border: 1px solid #d9d9d9; padding: 12px; border-radius: 4px;"></div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import http from '../api/http';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const projectId = route.params.projectId as string;

const releases = ref<any[]>([]);
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const loading = ref(false);
const q = ref('');
const released = ref<string | undefined>();
const createModalVisible = ref(false);
const detailModalVisible = ref(false);
const createLoading = ref(false);
const selectedRelease = ref<any>(null);
const auth = useAuthStore();
const canManage = computed(() => auth.hasAnyRole(['admin','project_manager']));

const createForm = reactive({
  name: '',
  tag: '',
  notes: ''
});

const columns = [
  { title: '名称', dataIndex: 'name', sorter: true },
  { title: '标签', dataIndex: 'tag', sorter: true },
  { 
    title: '创建时间', 
    dataIndex: 'createdAt',
    key: 'createdAt',
    slots: { customRender: 'createdAt' },
    sorter: true,
  },
  { 
    title: '发布时间', 
    dataIndex: 'releasedAt',
    key: 'releasedAt',
    slots: { customRender: 'releasedAt' },
    sorter: true,
  },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 状态颜色移除；以 releasedAt 是否存在判断

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

async function load() {
  loading.value = true;
  try {
    const res = await http.get(`/projects/${projectId}/releases`, { params: { q: q.value, released: released.value } });
    const list = res.data.data || res.data || [];
    releases.value = Array.isArray(list) ? list : [];
    pagination.value.total = releases.value.length;
  } catch (e: any) {
    message.error(e?.response?.data?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function onTableChange(p: any) {
  pagination.value = { ...pagination.value, current: p.current, pageSize: p.pageSize } as any;
  load();
}

function showCreateModal() {
  createModalVisible.value = true;
  Object.assign(createForm, { name: '', tag: '', notes: '' });
}

async function createRelease() {
  if (!createForm.name || !createForm.tag) {
    message.warning('请填写名称和标签');
    return;
  }
  
  createLoading.value = true;
  try {
    await http.post(`/projects/${projectId}/releases`, { name: createForm.name, tag: createForm.tag, notes: createForm.notes });
    message.success('发布创建成功');
    createModalVisible.value = false;
    await load();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '创建失败');
  } finally {
    createLoading.value = false;
  }
}

function viewRelease(record: any) {
  selectedRelease.value = record;
  detailModalVisible.value = true;
}

async function publishRelease(record: any) {
  try {
    await http.patch(`/projects/${projectId}/releases/${record.id}/publish`);
    message.success('发布成功');
    await load();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '发布失败');
  }
}

onMounted(load);
</script>
