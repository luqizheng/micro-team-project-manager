<template>
  <a-card title="工时报表（预估 vs 实际）" :bordered="false">
    <a-space style="margin-bottom:12px">
      <a-date-picker v-model:value="from" placeholder="开始日期" />
      <a-date-picker v-model:value="to" placeholder="结束日期" />
      <a-button type="primary" @click="load">查询</a-button>
    </a-space>
    <a-descriptions bordered :column="1" size="small">
      <a-descriptions-item label="预估工时(小时)">{{data.estimated}}</a-descriptions-item>
      <a-descriptions-item label="实际工时(小时)">{{data.actual}}</a-descriptions-item>
      <a-descriptions-item label="任务数量">{{data.count}}</a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import http from '../api/http';
import { useRoute } from 'vue-router';

const route = useRoute();
const projectId = route.params.projectId as string;
const from = ref<any>();
const to = ref<any>();
const data = ref<any>({ estimated: 0, actual: 0, count: 0 });

async function load() {
  const params: any = {};
  if (from.value) params.from = from.value.format('YYYY-MM-DD');
  if (to.value) params.to = to.value.format('YYYY-MM-DD');
  const res = await http.get(`/projects/${projectId}/reports/hours`, { params });
  data.value = res.data.data;
}
</script>


