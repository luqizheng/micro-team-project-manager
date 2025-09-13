<template>
  <div class="gitlab-mappings-tab">
    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索项目名称或GitLab路径"
            @search="handleSearch"
            allow-clear
          />
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="projectFilter"
            placeholder="选择项目"
            allow-clear
            @change="handleFilter"
          >
            <a-select-option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="4">
          <a-select
            v-model:value="instanceFilter"
            placeholder="选择实例"
            allow-clear
            @change="handleFilter"
          >
            <a-select-option
              v-for="instance in instances"
              :key="instance.id"
              :value="instance.id"
            >
              {{ instance.name }}
            </a-select-option>
          </a-select>
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
        <a-col :span="6" class="text-right">
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
              添加映射
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <!-- 映射列表 -->
    <a-table
      :columns="columns"
      :data-source="filteredMappings"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'project'">
          <div class="project-info">
            <a-avatar :size="24" :src="record.project?.avatar">
              <template #icon>
                <ProjectOutlined />
              </template>
            </a-avatar>
            <div class="project-details">
              <div class="project-name">{{ record.project?.name || '未知项目' }}</div>
              <div class="project-description">{{ record.project?.description || '' }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'gitlabProject'">
          <div class="gitlab-project">
            <div class="project-path">{{ record.gitlabProjectPath }}</div>
            <div class="project-id">ID: {{ record.gitlabProjectId }}</div>
          </div>
        </template>

        <template v-else-if="column.key === 'instance'">
          <div class="instance-info">
            <a-avatar :size="20" :src="record.gitlabInstance?.avatar">
              <template #icon>
                <DatabaseOutlined />
              </template>
            </a-avatar>
            <span class="instance-name">{{ record.gitlabInstance?.name || '未知实例' }}</span>
          </div>
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
            <a-tooltip title="同步映射">
              <a-button
                type="text"
                size="small"
                @click="$emit('sync', record)"
                :loading="syncingMappings.includes(record.id)"
              >
                <template #icon>
                  <SyncOutlined />
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
                title="确定要删除这个映射吗？"
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
  ProjectOutlined,
  DatabaseOutlined,
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';

// Props
interface Props {
  mappings: any[];
  projects: any[];
  instances: any[];
  loading: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  refresh: [];
  create: [];
  edit: [mapping: any];
  delete: [mapping: any];
  sync: [mapping: any];
}>();

// 响应式数据
const searchText = ref('');
const projectFilter = ref('');
const instanceFilter = ref('');
const statusFilter = ref('');
const syncingMappings = ref<string[]>([]);

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
    title: '项目信息',
    key: 'project',
    width: 250,
  },
  {
    title: 'GitLab项目',
    key: 'gitlabProject',
    width: 200,
  },
  {
    title: 'GitLab实例',
    key: 'instance',
    width: 150,
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
const filteredMappings = computed(() => {
  let filtered = props.mappings;

  // 搜索筛选
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(mapping =>
      mapping.project?.name.toLowerCase().includes(search) ||
      mapping.gitlabProjectPath.toLowerCase().includes(search)
    );
  }

  // 项目筛选
  if (projectFilter.value) {
    filtered = filtered.filter(mapping => mapping.projectId === projectFilter.value);
  }

  // 实例筛选
  if (instanceFilter.value) {
    filtered = filtered.filter(mapping => mapping.gitlabInstanceId === instanceFilter.value);
  }

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(mapping => {
      if (statusFilter.value === 'active') {
        return mapping.isActive;
      } else if (statusFilter.value === 'inactive') {
        return !mapping.isActive;
      }
      return true;
    });
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

// 监听同步状态
watch(() => props.mappings, (newMappings) => {
  // 清除同步状态
  syncingMappings.value = [];
}, { deep: true });
</script>

<style scoped>
.gitlab-mappings-tab {
  padding: 0;
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-details {
  flex: 1;
}

.project-name {
  font-weight: 500;
  color: #262626;
}

.project-description {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.gitlab-project {
  display: flex;
  flex-direction: column;
}

.project-path {
  font-weight: 500;
  color: #262626;
}

.project-id {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.instance-name {
  font-size: 14px;
  color: #262626;
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
