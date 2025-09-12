<template>
  <a-select
    v-model:value="selectedValue"
    :placeholder="placeholder"
    :loading="loading"
    :disabled="disabled"
    :allow-clear="allowClear"
    :style="{ width: '100%' }"
    show-search
    :filter-option="false"
    @search="handleSearch"
    @change="handleChange"
  >
    <a-select-option
      v-for="state in filteredStates"
      :key="state.stateKey"
      :value="state.stateKey"
    >
      <a-tag :color="state.color">{{ state.stateName }}</a-tag>
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import http from '../api/http';
import { message } from 'ant-design-vue';

interface IssueState {
  id: string;
  stateKey: string;
  stateName: string;
  color: string;
  isInitial: boolean;
  isFinal: boolean;
  sortOrder: number;
}

interface Props {
  modelValue?: string;
  projectId: string;
  issueType: 'requirement' | 'task' | 'bug';
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择状态',
  disabled: false,
  allowClear: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  'change': [value: string | undefined, state: IssueState | undefined];
}>();

const selectedValue = ref<string | undefined>(props.modelValue);
const states = ref<IssueState[]>([]);
const filteredStates = ref<IssueState[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue;
});

// 监听 selectedValue 变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue);
  const selectedState = states.value.find(state => state.stateKey === newValue);
  emit('change', newValue, selectedState);
});

// 监听 issueType 变化，重新加载状态
watch(() => props.issueType, () => {
  loadStates();
});

// 搜索处理
function handleSearch(value: string) {
  searchKeyword.value = value;
  filterStates();
}

// 过滤状态
function filterStates() {
  if (!searchKeyword.value) {
    filteredStates.value = states.value;
  } else {
    filteredStates.value = states.value.filter(state =>
      state.stateName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      state.stateKey.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
}

// 变化处理
function handleChange(value: string | undefined) {
  selectedValue.value = value;
}

// 加载状态列表
async function loadStates() {
  if (loading.value) return;
  
  loading.value = true;
  try {
    const res = await http.get(`/projects/${props.projectId}/issues/states/${props.issueType}`);
    states.value = res.data.data || [];
    filterStates();
  } catch (e) {
    message.error('加载状态列表失败');
    states.value = [];
    filteredStates.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStates();
});
</script>

<style scoped>
.ant-tag {
  margin: 0;
}
</style>