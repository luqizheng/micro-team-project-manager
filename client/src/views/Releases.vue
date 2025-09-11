<template>
  <a-card title="发布管理" :bordered="false">
    <a-space style="margin-bottom: 16px">
      <a-button type="primary" @click="showCreateModal">创建发布</a-button>
      <a-button @click="load">刷新</a-button>
    </a-space>

    <a-table :columns="columns" :data-source="releases" :pagination="pagination" row-key="id" @change="onTableChange">
      <template #status="{ record }">
        <a-tag :color="getStatusColor(record.status)">{{ record.status }}</a-tag>
      </template>
      <template #createdAt="{ record }">
        {{ formatDate(record.createdAt) }}
      </template>
      <template #publishedAt="{ record }">
        {{ record.publishedAt ? formatDate(record.publishedAt) : '-' }}
      </template>
      <template #action="{ record }">
        <a-space>
          <a @click="viewRelease(record)">查看</a>
          <a v-if="record.status === 'draft'" @click="publishRelease(record)">发布</a>
          <a-popconfirm title="确定删除此发布？" @confirm="deleteRelease(record)">
            <a style="color: red">删除</a>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 创建发布模态框 -->
    <a-modal v-model:open="createModalVisible" title="创建发布" @ok="createRelease" :confirm-loading="createLoading">
      <a-form :model="createForm" :label-col="{span: 6}" :wrapper-col="{span: 16}">
        <a-form-item label="版本号" required>
          <a-input v-model:value="createForm.version" placeholder="如 v1.0.0" />
        </a-form-item>
        <a-form-item label="标题" required>
          <a-input v-model:value="createForm.title" placeholder="发布标题" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="createForm.description" placeholder="发布描述" :rows="3" />
        </a-form-item>
        <a-form-item label="开始日期">
          <a-date-picker v-model:value="createForm.startDate" style="width: 100%" />
        </a-form-item>
        <a-form-item label="结束日期">
          <a-date-picker v-model:value="createForm.endDate" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 发布详情模态框 -->
    <a-modal v-model:open="detailModalVisible" title="发布详情" width="800px" :footer="null">
      <div v-if="selectedRelease">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="版本号">{{ selectedRelease.version }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(selectedRelease.status)">{{ selectedRelease.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="标题">{{ selectedRelease.title }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(selectedRelease.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="发布时间" v-if="selectedRelease.publishedAt">
            {{ formatDate(selectedRelease.publishedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">{{ selectedRelease.description || '-' }}</a-descriptions-item>
        </a-descriptions>

        <a-divider>发布说明</a-divider>
        <div v-html="selectedRelease.releaseNotes" style="max-height: 400px; overflow-y: auto; border: 1px solid #d9d9d9; padding: 12px; border-radius: 4px;"></div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import http from '../api/http';

const route = useRoute();
const projectId = route.params.projectId as string;

const releases = ref<any[]>([]);
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const createModalVisible = ref(false);
const detailModalVisible = ref(false);
const createLoading = ref(false);
const selectedRelease = ref<any>(null);

const createForm = reactive({
  version: '',
  title: '',
  description: '',
  startDate: null,
  endDate: null
});

const columns = [
  { title: '版本号', dataIndex: 'version' },
  { title: '标题', dataIndex: 'title' },
  { 
    title: '状态', 
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' }
  },
  { 
    title: '创建时间', 
    dataIndex: 'createdAt',
    key: 'createdAt',
    slots: { customRender: 'createdAt' }
  },
  { 
    title: '发布时间', 
    dataIndex: 'publishedAt',
    key: 'publishedAt',
    slots: { customRender: 'publishedAt' }
  },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'blue',
    published: 'green',
    archived: 'gray'
  };
  return colors[status] || 'default';
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

async function load() {
  try {
    const { current, pageSize } = pagination.value as any;
    const res = await http.get(`/projects/${projectId}/releases`, {
      params: { page: current, pageSize }
    });
    releases.value = res.data.data.items || [];
    pagination.value.total = res.data.data.total || 0;
  } catch (e: any) {
    message.error(e?.response?.data?.message || '加载失败');
  }
}

function onTableChange(p: any) {
  pagination.value = { ...pagination.value, current: p.current, pageSize: p.pageSize } as any;
  load();
}

function showCreateModal() {
  createModalVisible.value = true;
  Object.assign(createForm, {
    version: '',
    title: '',
    description: '',
    startDate: null,
    endDate: null
  });
}

async function createRelease() {
  if (!createForm.version || !createForm.title) {
    message.warning('请填写版本号和标题');
    return;
  }
  
  createLoading.value = true;
  try {
    const data = {
      ...createForm,
      startDate: createForm.startDate?.format('YYYY-MM-DD'),
      endDate: createForm.endDate?.format('YYYY-MM-DD')
    };
    await http.post(`/projects/${projectId}/releases`, data);
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
    await http.post(`/projects/${projectId}/releases/${record.id}/publish`);
    message.success('发布成功');
    await load();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '发布失败');
  }
}

async function deleteRelease(record: any) {
  try {
    await http.delete(`/projects/${projectId}/releases/${record.id}`);
    message.success('删除成功');
    await load();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '删除失败');
  }
}

onMounted(load);
</script>
