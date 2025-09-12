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
      v-for="issue in filteredIssues"
      :key="issue.id"
      :value="issue.id"
      :disabled="isDisabled(issue)"
    >
      <div class="issue-option">
        <span class="issue-title">{{ issue.title }}</span>
        <span class="issue-meta">
          [{{ getTypeLabel(issue.type) }}] {{ issue.state }}
        </span>
      </div>
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import http from '../api/http';
import { message } from 'ant-design-vue';

interface Issue {
  id: string;
  title: string;
  type: 'requirement' | 'task' | 'bug';
  state: string;
  parentId?: string;
}

interface Props {
  modelValue?: string;
  projectId: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  excludeId?: string; // 排除的 Issue ID（用于编辑时排除自己）
  excludeChildren?: boolean; // 是否排除子任务（用于选择父级时排除子任务）
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择事项',
  disabled: false,
  allowClear: true,
  excludeChildren: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  'change': [value: string | undefined, issue: Issue | undefined];
}>();

const selectedValue = ref<string | undefined>(props.modelValue);
const issues = ref<Issue[]>([]);
const filteredIssues = ref<Issue[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue;
});

// 监听 selectedValue 变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue);
  const selectedIssue = issues.value.find(issue => issue.id === newValue);
  emit('change', newValue, selectedIssue);
});

// 获取类型标签
function getTypeLabel(type: string) {
  const labels = {
    requirement: '需求',
    task: '任务',
    bug: '缺陷',
  };
  return labels[type as keyof typeof labels] || type;
}

// 检查是否禁用
function isDisabled(issue: Issue) {
  if (props.excludeId && issue.id === props.excludeId) {
    return true;
  }
  if (props.excludeChildren && issue.parentId) {
    return true;
  }
  return false;
}

// 搜索处理
function handleSearch(value: string) {
  searchKeyword.value = value;
  filterIssues();
}

// 过滤事项
function filterIssues() {
  if (!searchKeyword.value) {
    filteredIssues.value = issues.value;
  } else {
    filteredIssues.value = issues.value.filter(issue =>
      issue.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
}

// 变化处理
function handleChange(value: string | undefined) {
  selectedValue.value = value;
}

// 加载事项列表
async function loadIssues() {
  if (loading.value) return;
  
  loading.value = true;
  try {
    const res = await http.get(`/projects/${props.projectId}/issues`, {
      params: {
        page: 1,
        pageSize: 1000, // 获取所有事项
        sortField: 'createdAt',
        sortOrder: 'DESC',
      }
    });
    
    issues.value = res.data.data?.items || [];
    filterIssues();
  } catch (e) {
    message.error('加载事项列表失败');
    issues.value = [];
    filteredIssues.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadIssues();
});
</script>

<style scoped>
.issue-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.issue-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-meta {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
  flex-shrink: 0;
}
</style>
