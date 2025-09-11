<template>
  <a-card title="创建事项" :bordered="false">
    <a-form :model="form" :label-col="{span:6}" :wrapper-col="{span:14}" @submit.prevent>
      <a-form-item label="类型" required>
        <a-select v-model:value="form.type" style="width: 200px">
          <a-select-option value="task">任务</a-select-option>
          <a-select-option value="requirement">需求</a-select-option>
          <a-select-option value="bug">缺陷</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="标题" required>
        <a-input v-model:value="form.title" maxlength="140" />
      </a-form-item>
      <a-form-item v-if="form.type==='task'" label="预计工时(小时)" :validate-status="vh('estimatedHours')" :help="vhMsg('estimatedHours')">
        <a-input v-model:value="eh" placeholder="如 2 或 2.5" @change="onHoursChange('estimatedHours', eh)" />
      </a-form-item>
      <a-form-item v-if="form.type==='task'" label="实际工时(小时)" :validate-status="vh('actualHours')" :help="vhMsg('actualHours')">
        <a-input v-model:value="ah" placeholder="如 1 或 1.5" @change="onHoursChange('actualHours', ah)" />
      </a-form-item>
      <a-form-item :wrapper-col="{offset:6}">
        <a-button type="primary" @click="submit">提交</a-button>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import http from '../api/http';
import { useRoute } from 'vue-router';

const route = useRoute();
const projectId = route.params.projectId as string;

const form = reactive<any>({ type: 'task', title: '' });
const errors = reactive<Record<string, string>>({});
const eh = ref('');
const ah = ref('');

function validateHourString(v: string) {
  return /^\d{1,3}(\.\d)?$/.test(v);
}

function onHoursChange(key: 'estimatedHours'|'actualHours', v: string) {
  if (!v) { delete errors[key]; (form as any)[key] = undefined; return; }
  if (!validateHourString(v)) { errors[key] = '最多一位小数，示例 2 或 2.5'; return; }
  delete errors[key];
  (form as any)[key] = parseFloat(v);
}

function vh(k: string) { return errors[k] ? 'error' : undefined; }
function vhMsg(k: string) { return errors[k]; }

async function submit() {
  if (form.type === 'task') {
    if (eh.value && !validateHourString(eh.value)) { errors['estimatedHours']='最多一位小数'; return; }
    if (ah.value && !validateHourString(ah.value)) { errors['actualHours']='最多一位小数'; return; }
  }
  await http.post(`/projects/${projectId}/issues`, { ...form, projectId });
  window.history.back();
}
</script>


