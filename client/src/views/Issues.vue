<template>
  <a-card title="事项列表" :bordered="false">
    <a-space style="margin-bottom:12px">
      <a-input v-model:value="q" placeholder="搜索标题" allow-clear style="width:240px" />
      <a-select v-model:value="type" placeholder="类型" allow-clear style="width:140px">
        <a-select-option value="task">任务</a-select-option>
        <a-select-option value="requirement">需求</a-select-option>
        <a-select-option value="bug">缺陷</a-select-option>
      </a-select>
      <a-button type="primary" @click="load">搜索</a-button>
    </a-space>
    <a-table
      :columns="columns"
      :data-source="items"
      :pagination="pagination"
      row-key="id"
      @change="onTableChange"
    >
      <template #title="{ record }">
        <a @click="() => router.push(`/projects/${projectId}/issues/${record.id}`)">{{ record.title }}</a>
      </template>
      <template #summary>
        <a-table-summary fixed>
          <a-table-summary-row>
            <a-table-summary-cell :index="0" :col-span="3">合计</a-table-summary-cell>
            <a-table-summary-cell :index="3">{{ totalEstimated }}</a-table-summary-cell>
            <a-table-summary-cell :index="4">{{ totalActual }}</a-table-summary-cell>
          </a-table-summary-row>
        </a-table-summary>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import http from '../api/http';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const items = ref<any[]>([]);
const q = ref('');
const type = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });

const columns = [
  { 
    title: '标题', 
    dataIndex: 'title',
    key: 'title',
    slots: { customRender: 'title' }
  },
  { title: '类型', dataIndex: 'type' },
  { title: '状态', dataIndex: 'state' },
  { title: '预估(小时)', dataIndex: 'estimatedHours' },
  { title: '实际(小时)', dataIndex: 'actualHours' },
];

const totalEstimated = ref(0);
const totalActual = ref(0);

async function load() {
  const { current, pageSize } = pagination.value as any;
  const res = await http.get(`/projects/${projectId}/issues`, { params: { page: current, pageSize, q: q.value, type: type.value } });
  items.value = res.data.data.items;
  pagination.value.total = res.data.data.total;
  totalEstimated.value = res.data.data.totalEstimated || 0;
  totalActual.value = res.data.data.totalActual || 0;
}

function onTableChange(p: any) {
  pagination.value = { ...pagination.value, current: p.current, pageSize: p.pageSize } as any;
  load();
}

onMounted(load);
</script>


