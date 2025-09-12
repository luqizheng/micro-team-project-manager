<template>
  <a-select
    v-model:value="selectedValue"
    :placeholder="placeholder"
    :loading="loading"
    :disabled="disabled"
    :allow-clear="allowClear"
    :show-search="true"
    :filter-option="false"
    :not-found-content="loading ? undefined : '暂无数据'"
    @search="handleSearch"
    @change="handleChange"
    @dropdown-visible-change="handleDropdownVisibleChange"
    style="width: 100%"
  >
    <a-select-option
      v-for="user in userList"
      :key="user.id"
      :value="user.id"
      :label="user.name"
    >
      <div class="user-option">
        <a-avatar :size="20" :src="user.avatar" style="margin-right: 8px">
          {{ user.name?.charAt(0)?.toUpperCase() }}
        </a-avatar>
        <span>{{ user.name }}</span>
        <span v-if="user.email" class="user-email">({{ user.email }})</span>
      </div>
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import http from '../api/http';
import { message } from 'ant-design-vue';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  projectId?: string; // 可选的项目ID，用于过滤项目成员
}

interface Emits {
  (e: 'update:modelValue', value: string | undefined): void;
  (e: 'change', value: string | undefined, user: User | undefined): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择用户',
  disabled: false,
  allowClear: true,
});

const emit = defineEmits<Emits>();

const selectedValue = ref<string | undefined>(props.modelValue);
const userList = ref<User[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue;
});

// 监听选择值变化
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue);
  const selectedUser = userList.value.find(user => user.id === newValue);
  emit('change', newValue, selectedUser);
});

// 搜索用户
const handleSearch = (value: string) => {
  searchKeyword.value = value;
  loadUsers();
};

// 下拉框显示/隐藏
const handleDropdownVisibleChange = (open: boolean) => {
  if (open && userList.value.length === 0) {
    loadUsers();
  }
};

// 选择变化
const handleChange = (value: string | undefined) => {
  selectedValue.value = value;
};

// 加载用户列表
const loadUsers = async () => {
  if (loading.value) return;
  
  loading.value = true;
  try {
    let url = '/users';
    const params: any = {
      page: 1,
      pageSize: 50, // 限制数量提高性能
    };
    
    // 如果有搜索关键词
    if (searchKeyword.value) {
      params.q = searchKeyword.value;
    }
    
    // 如果指定了项目ID，获取项目成员
    if (props.projectId) {
      url = `/projects/${props.projectId}/members`;
    }
    
    const response = await http.get(url, { params });
    const users = response.data.data?.items || response.data.data || [];
    
    userList.value = users.map((user: any) => ({
      id: user.id,
      name: user.name || user.username || '未知用户',
      email: user.email,
      avatar: user.avatar,
    }));
  } catch (error: any) {
    console.error('加载用户列表失败:', error);
    
    // 更详细的错误处理
    if (error.response?.status === 403) {
      message.error('权限不足，无法加载用户列表');
    } else if (error.response?.status === 404) {
      message.error('项目不存在或接口未找到');
    } else if (error.response?.status === 401) {
      message.error('请先登录');
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      message.error('网络连接失败，请检查后端服务');
    } else {
      message.error(`加载用户列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
    }
    
    userList.value = [];
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载用户
onMounted(() => {
  loadUsers();
});

// 暴露方法给父组件
defineExpose({
  loadUsers,
  clear: () => {
    selectedValue.value = undefined;
  }
});
</script>

<style scoped>
.user-option {
  display: flex;
  align-items: center;
  width: 100%;
}

.user-email {
  color: #999;
  font-size: 12px;
  margin-left: 4px;
}

:deep(.ant-select-item-option-content) {
  display: flex;
  align-items: center;
}
</style>