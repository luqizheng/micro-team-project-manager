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
    <a-table :columns="columns" :data-source="items" :pagination="pagination" row-key="id" @change="onTableChange" />
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const items = ref<any[]>([]);
const q = ref('');
const visibility = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });

const columns = [
  { title: 'KEY', dataIndex: 'key' },
  { title: '名称', dataIndex: 'name' },
  { title: '可见性', dataIndex: 'visibility' },
];

async function load() {
  const { current, pageSize } = pagination.value as any;
  const res = await axios.get('/api/v1/projects', { params: { page: current, pageSize, q: q.value, visibility: visibility.value } });
  items.value = res.data.data.items;
  pagination.value.total = res.data.data.total;
}

function onTableChange(p: any) {
  pagination.value = { ...pagination.value, current: p.current, pageSize: p.pageSize } as any;
  load();
}

onMounted(load);
</script>


