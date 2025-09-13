<template>
  <div class="gitlab-instances-tab">
    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索实例名称或URL"
            @search="handleSearch"
            allow-clear
          />
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="statusFilter"
            placeholder="状态筛选"
            allow-clear
            @change="handleFilter"
          >
            <a-select-option value="active">活跃</a-select-option>
            <a-select-option value="inactive">非活跃</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="typeFilter"
            placeholder="类型筛选"
            allow-clear
            @change="handleFilter"
          >
            <a-select-option value="self_hosted">自托管</a-select-option>
            <a-select-option value="gitlab_com">GitLab.com</a-select-option>
          </a-select>
        </a-col>
        <a-col :span="8" class="text-right">
          <a-space>
            <a-button @click="handleRefresh">
              <template #icon>
                <ReloadOutlined />
              </template>
              刷新
            </a-button>
            <a-button type="primary" @click="$emit('create')">
              <template #icon>
                <PlusOutlined />
              </template>
              添加实例
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <!-- 实例列表 -->
    <a-table
      :columns="columns"
      :data-source="filteredInstances"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <div class="instance-name">
            <a-avatar :src="record.avatar" :size="32">
              <template #icon>
                <DatabaseOutlined />
              </template>
            </a-avatar>
            <div class="name-info">
              <div class="name">{{ record.name }}</div>
              <div class="url">{{ record.url }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'type'">
          <a-tag :color="record.type === 'self_hosted' ? 'blue' : 'green'">
            {{ record.type === 'self_hosted' ? '自托管' : 'GitLab.com' }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.isActive ? 'success' : 'default'">
            {{ record.isActive ? '活跃' : '非活跃' }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'lastSyncAt'">
          <span v-if="record.lastSyncAt">
            {{ formatDate(record.lastSyncAt) }}
          </span>
          <span v-else class="text-muted">从未同步</span>
        </template>

        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-tooltip title="测试连接">
              <a-button
                type="text"
                size="small"
                @click="$emit('test', record)"
                :loading="testingInstances.includes(record.id)"
              >
                <template #icon>
                  <CheckCircleOutlined />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip title="编辑">
              <a-button
                type="text"
                size="small"
                @click="$emit('edit', record)"
              >
                <template #icon>
                  <EditOutlined />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip title="删除">
              <a-popconfirm
                title="确定要删除这个实例吗？"
                @confirm="$emit('delete', record)"
              >
                <a-button
                  type="text"
                  size="small"
                  danger
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-popconfirm>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ReloadOutlined,
  PlusOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

// Props
interface Props {
  instances: any[];
  loading: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  refresh: [];
  create: [];
  edit: [instance: any];
  delete: [instance: any];
  test: [instance: any];
}>();

// 响应式数据
const searchText = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const testingInstances = ref<string[]>([]);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 表格列配置
const columns = [
  {
    title: '实例信息',
    key: 'name',
    width: 300,
  },
  {
    title: '类型',
    key: 'type',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '最后同步',
    key: 'lastSyncAt',
    width: 180,
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
  },
];

// 计算属性
const filteredInstances = computed(() => {
  let filtered = props.instances;

  // 搜索筛选
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(instance =>
      instance.name.toLowerCase().includes(search) ||
      instance.url.toLowerCase().includes(search)
    );
  }

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(instance => {
      if (statusFilter.value === 'active') {
        return instance.isActive;
      } else if (statusFilter.value === 'inactive') {
        return !instance.isActive;
      }
      return true;
    });
  }

  // 类型筛选
  if (typeFilter.value) {
    filtered = filtered.filter(instance => instance.type === typeFilter.value);
  }

  // 更新分页总数
  pagination.value.total = filtered.length;

  return filtered;
});

// 方法
const handleSearch = () => {
  pagination.value.current = 1;
};

const handleFilter = () => {
  pagination.value.current = 1;
};

const handleRefresh = () => {
  emit('refresh');
};

const handleTableChange = (pag: any) => {
  pagination.value = { ...pagination.value, ...pag };
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

// 监听测试连接状态
watch(() => props.instances, (newInstances) => {
  // 清除测试状态
  testingInstances.value = [];
}, { deep: true });
</script>

<style scoped>
.gitlab-instances-tab {
  padding: 0;
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.instance-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-info {
  flex: 1;
}

.name {
  font-weight: 500;
  color: #262626;
}

.url {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.text-muted {
  color: #8c8c8c;
}

.text-right {
  text-align: right;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

:deep(.ant-avatar) {
  background-color: #1890ff;
}
</style>
