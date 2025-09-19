<template>
  <a-select
    v-model:value="selectedGroupId"
    placeholder="选择GitLab分组"
    :loading="loading"
    :disabled="!instanceId"
    :filter-option="false"
    show-search
    @search="handleSearch"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @change="handleChange"
  >
    <a-select-option
      v-for="group in groups"
      :key="group.id"
      :value="group.id"
    >
      <div class="group-option">
        <div class="group-name">{{ group.name }}</div>
        <div class="group-path">{{ group.fullPath }}</div>
        <div class="group-meta">
          <a-tag :color="getVisibilityColor(group.visibility)" size="small">
            {{ getVisibilityText(group.visibility) }}
          </a-tag>
          <span class="projects-count">{{ group.projectsCount }} 个项目</span>
        </div>
      </div>
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import http from '../../api/http';

interface GitLabGroup {
  id: number;
  name: string;
  path: string;
  fullPath: string;
  description?: string;
  visibility: string;
  projectsCount: number;
}

interface Props {
  value?: number;
  instanceId?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'update:value', value: number | undefined): void;
  (e: 'change', group: GitLabGroup): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedGroupId = ref<number | undefined>(props.value);
const groups = ref<GitLabGroup[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

const getVisibilityColor = (visibility: string) => {
  const colorMap: Record<string, string> = {
    private: 'red',
    internal: 'orange',
    public: 'green',
  };
  return colorMap[visibility] || 'default';
};

const getVisibilityText = (visibility: string) => {
  const textMap: Record<string, string> = {
    private: '私有',
    internal: '内部',
    public: '公开',
  };
  return textMap[visibility] || visibility;
};

const loadGroups = async (search?: string) => {
  if (!props.instanceId) {
    groups.value = [];
    return;
  }

  loading.value = true;
  try {
    const params: any = {
      page: 1,
      perPage: 50,
    };
    
    if (search) {
      params.search = search;
    }

    const response = await http.get(`/gitlab/instances/${props.instanceId}/groups`, {
      params,
    });

    groups.value = response.data.groups || [];
  } catch (error: any) {
    message.error('加载分组列表失败');
    console.error('Load groups error:', error);
    groups.value = [];
  } finally {
    loading.value = false;
  }
};

const handleSearch = (value: string) => {
  searchKeyword.value = value;
  // 防抖处理
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    loadGroups(value);
  }, 300);
};

const searchTimeout = ref<number>();

const handleDropdownVisibleChange = (open: boolean) => {
  if (open && groups.value.length === 0) {
    loadGroups();
  }
};

const handleChange = (groupId: number) => {
  const group = groups.value.find(g => g.id === groupId);
  if (group) {
    emit('change', group);
  }
};

// 监听value变化
watch(() => props.value, (newValue) => {
  selectedGroupId.value = newValue;
});

// 监听instanceId变化
watch(() => props.instanceId, (newInstanceId) => {
  if (newInstanceId) {
    loadGroups();
  } else {
    groups.value = [];
    selectedGroupId.value = undefined;
  }
});
</script>

<style scoped>
.group-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.group-name {
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 2px;
}

.group-path {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.projects-count {
  font-size: 12px;
  color: #999;
}
</style>
