<template>
  <a-card title="工时报表（预估 vs 实际）" :bordered="false">
    <a-space style="margin-bottom:12px" wrap>
      <a-date-picker v-model:value="from" placeholder="开始日期" />
      <a-date-picker v-model:value="to" placeholder="结束日期" />
      <a-button type="primary" @click="load" :loading="loading">查询</a-button>
      <a-button @click="exportCsv" :disabled="loading || !hasData">导出 CSV</a-button>
    </a-space>
    <a-descriptions bordered :column="1" size="small">
      <a-descriptions-item label="预估工时(小时)">{{data.estimated}}</a-descriptions-item>
      <a-descriptions-item label="实际工时(小时)">{{data.actual}}</a-descriptions-item>
      <a-descriptions-item label="任务数量">{{data.count}}</a-descriptions-item>
    </a-descriptions>

    <div style="margin-top:16px">
      <div style="display:flex; gap:12px; align-items:flex-end; height:160px">
        <div style="flex:1">
          <div style="height:100%; display:flex; align-items:flex-end">
            <div :style="barStyle(data.estimated, maxValue, '#69c0ff')"></div>
          </div>
          <div style="text-align:center;margin-top:6px">预估</div>
        </div>
        <div style="flex:1">
          <div style="height:100%; display:flex; align-items:flex-end">
            <div :style="barStyle(data.actual, maxValue, '#95de64')"></div>
          </div>
          <div style="text-align:center;margin-top:6px">实际</div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import http from '../api/http';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';

const route = useRoute();
const projectId = route.params.projectId as string;
const from = ref<any>();
const to = ref<any>();
const data = ref<any>({ estimated: 0, actual: 0, count: 0 });
const loading = ref(false);
const hasData = computed(() => (data.value?.estimated || 0) > 0 || (data.value?.actual || 0) > 0 || (data.value?.count || 0) > 0);
const maxValue = computed(() => Math.max(data.value?.estimated || 0, data.value?.actual || 0, 1));

async function load() {
  loading.value = true;
  try {
    const params: any = {};
    if (from.value) params.from = from.value.format('YYYY-MM-DD');
    if (to.value) params.to = to.value.format('YYYY-MM-DD');
    const res = await http.get(`/projects/${projectId}/reports/hours`, { params });
    data.value = res.data.data;
  } catch (e) {
    message.error('加载报表失败');
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  const rows = [
    ['项目ID', projectId],
    ['起始', from.value ? from.value.format('YYYY-MM-DD') : ''],
    ['截止', to.value ? to.value.format('YYYY-MM-DD') : ''],
    [],
    ['指标', '数值'],
    ['预估(小时)', String(data.value.estimated || 0)],
    ['实际(小时)', String(data.value.actual || 0)],
    ['任务数量', String(data.value.count || 0)],
  ];
  const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hours-report-${projectId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function barStyle(value: number, max: number, color: string) {
  const h = Math.round((Math.max(0, value) / Math.max(1, max)) * 140);
  return { width: '100%', height: `${h}px`, background: color, borderRadius: '4px' } as any;
}
</script>


