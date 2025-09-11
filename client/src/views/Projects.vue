<template>
  <a-card title="项目列表" :bordered="false">
    <a-space style="margin-bottom:12px">
      <a-input v-model:value="q" placeholder="搜索名称或KEY" allow-clear style="width:240px" />
      <a-select v-model:value="visibility" placeholder="可见性" allow-clear style="width:140px">
        <a-select-option value="private">private</a-select-option>
        <a-select-option value="public">public</a-select-option>
      </a-select>
      <a-button type="primary" @click="load">搜索</a-button>
    </a-space>
    <a-table :columns="columns" :data-source="items" :pagination="pagination" :loading="loading" row-key="id" @change="onTableChange">
      <template #action="{ record }">
        <a-space>
          <a @click="goIssues(record)">事项</a>
          <a @click="goNewIssue(record)">新建事项</a>
          <a @click="goHours(record)">工时报表</a>
          <a @click="goReleases(record)">发布管理</a>
        </a-space>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import http from '../api/http';
import { useLoading } from '../composables/useLoading';

const { loading, withLoading } = useLoading();

const items = ref<any[]>([]);
const q = ref('');
const visibility = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });

const router = useRouter();

const columns = [
  { title: 'KEY', dataIndex: 'key' },
  { title: '名称', dataIndex: 'name' },
  { title: '可见性', dataIndex: 'visibility' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } },
];

async function load() {
  await withLoading(async () => {
    const { current, pageSize } = pagination.value as any;
    const res = await http.get('/projects', { params: { page: current, pageSize, q: q.value, visibility: visibility.value } });
    items.value = res.data.data.items;
    pagination.value.total = res.data.data.total;
  });
}

function onTableChange(p: any) {
  pagination.value = { ...pagination.value, current: p.current, pageSize: p.pageSize } as any;
  load();
}

onMounted(load);

function goIssues(record: any) {
  router.push(`/projects/${record.id}/issues`);
}
function goNewIssue(record: any) {
  router.push(`/projects/${record.id}/issues/new`);
}
function goHours(record: any) {
  router.push(`/projects/${record.id}/reports/hours`);
}
function goReleases(record: any) {
  router.push(`/projects/${record.id}/releases`);
}
</script>


