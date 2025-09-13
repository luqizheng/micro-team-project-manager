<template>
  <div class="gitlab-sync-tab">
    <!-- 同步状态概览 -->
    <div class="sync-overview">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="活跃实例"
              :value="activeInstances"
              :loading="loading"
            >
              <template #prefix>
                <DatabaseOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="同步中任务"
              :value="runningSyncTasks"
              :loading="loading"
            >
              <template #prefix>
                <SyncOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="今日同步次数"
              :value="todaySyncCount"
              :loading="loading"
            >
              <template #prefix>
                <CalendarOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="同步成功率"
              :value="syncSuccessRate"
              suffix="%"
              :loading="loading"
            >
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 实例同步管理 -->
    <div class="instance-sync">
      <a-card title="实例同步管理" class="sync-card">
        <template #extra>
          <a-button @click="handleRefresh">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新状态
          </a-button>
        </template>

        <a-table
          :columns="instanceColumns"
          :data-source="instances"
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="instance-info">
                <a-avatar :size="24" :src="record.avatar">
                  <template #icon>
                    <DatabaseOutlined />
                  </template>
                </a-avatar>
                <div class="instance-details">
                  <div class="instance-name">{{ record.name }}</div>
                  <div class="instance-url">{{ record.url }}</div>
                </div>
              </div>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag :color="getInstanceStatusColor(record)">
                {{ getInstanceStatusText(record) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'lastSync'">
              <span v-if="record.lastSyncAt">
                {{ formatDate(record.lastSyncAt) }}
              </span>
              <span v-else class="text-muted">从未同步</span>
            </template>

            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleInstanceSync(key, record)">
                      <a-menu-item key="incremental">
                        <SyncOutlined />
                        增量同步
                      </a-menu-item>
                      <a-menu-item key="full">
                        <ReloadOutlined />
                        全量同步
                      </a-menu-item>
                      <a-menu-item key="compensation">
                        <ToolOutlined />
                        补偿同步
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button type="primary" size="small">
                    同步操作
                    <DownOutlined />
                  </a-button>
                </a-dropdown>

                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleUserSync(key, record)">
                      <a-menu-item key="sync-users">
                        <UserOutlined />
                        同步用户
                      </a-menu-item>
                      <a-menu-item key="cleanup-users">
                        <DeleteOutlined />
                        清理用户
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button size="small">
                    用户管理
                    <DownOutlined />
                  </a-button>
                </a-dropdown>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 同步历史 -->
    <div class="sync-history">
      <a-card title="同步历史" class="sync-card">
        <template #extra>
          <a-space>
            <a-range-picker
              v-model:value="dateRange"
              @change="handleDateRangeChange"
            />
            <a-button @click="handleRefreshHistory">
              <template #icon>
                <ReloadOutlined />
              </template>
              刷新
            </a-button>
          </a-space>
        </template>

        <a-table
          :columns="historyColumns"
          :data-source="syncHistory"
          :loading="loading"
          :pagination="historyPagination"
          row-key="id"
          @change="handleHistoryTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <a-tag :color="getSyncTypeColor(record.type)">
                {{ getSyncTypeText(record.type) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag :color="getSyncStatusColor(record.status)">
                {{ getSyncStatusText(record.status) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'duration'">
              <span v-if="record.duration">
                {{ formatDuration(record.duration) }}
              </span>
              <span v-else class="text-muted">-</span>
            </template>

            <template v-else-if="column.key === 'createdAt'">
              {{ formatDate(record.createdAt) }}
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  DatabaseOutlined,
  SyncOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DownOutlined,
  ToolOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';

// Props
interface Props {
  instances: any[];
  syncStatus: any;
  loading: boolean;
}

const props = defineProps<Props>();

  // Emits
  const emit = defineEmits<{
    refresh: () => void;
    'incremental-sync': (instanceId: string, projectId?: string) => void;
    'full-sync': (instanceId: string, projectId?: string) => void;
    'compensation-sync': (instanceId: string, projectId?: string) => void;
    'user-sync': (instanceId: string) => void;
  }>();

// 响应式数据
const dateRange = ref([]);
const syncHistory = ref([]);

// 分页配置
const historyPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 计算属性
const activeInstances = computed(() => {
  return props.instances.filter(instance => instance.isActive).length;
});

const runningSyncTasks = computed(() => {
  return props.syncStatus?.runningTasks || 0;
});

const todaySyncCount = computed(() => {
  return props.syncStatus?.todaySyncCount || 0;
});

const syncSuccessRate = computed(() => {
  const total = props.syncStatus?.totalSyncTasks || 0;
  const success = props.syncStatus?.successfulSyncTasks || 0;
  return total > 0 ? Math.round((success / total) * 100) : 0;
});

// 表格列配置
const instanceColumns = [
  {
    title: '实例信息',
    key: 'name',
    width: 250,
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
  },
  {
    title: '最后同步',
    key: 'lastSync',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
  },
];

const historyColumns = [
  {
    title: '同步类型',
    key: 'type',
    width: 120,
  },
  {
    title: '实例',
    key: 'instanceName',
    width: 150,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '持续时间',
    key: 'duration',
    width: 120,
  },
  {
    title: '开始时间',
    key: 'createdAt',
    width: 180,
  },
];

// 方法
const handleRefresh = () => {
  emit('refresh');
};

const handleInstanceSync = (type: string, instance: any) => {
  switch (type) {
    case 'incremental':
      emit('incremental-sync', instance.id);
      break;
    case 'full':
      emit('full-sync', instance.id);
      break;
    case 'compensation':
      emit('compensation-sync', instance.id);
      break;
  }
};

const handleUserSync = (action: string, instance: any) => {
  switch (action) {
    case 'sync-users':
      emit('user-sync', instance.id);
      break;
    case 'cleanup-users':
      // 这里可以添加清理用户的逻辑
      message.info('清理用户功能待实现');
      break;
  }
};

const handleDateRangeChange = () => {
  // 根据日期范围筛选同步历史
  refreshSyncHistory();
};

const handleRefreshHistory = () => {
  refreshSyncHistory();
};

const handleHistoryTableChange = (pag: any) => {
  historyPagination.value = { ...historyPagination.value, ...pag };
};

const refreshSyncHistory = () => {
  // 这里应该调用API获取同步历史
  // 简化实现
  syncHistory.value = [];
};

const getInstanceStatusColor = (instance: any) => {
  if (!instance.isActive) return 'default';
  if (instance.lastSyncAt) return 'success';
  return 'warning';
};

const getInstanceStatusText = (instance: any) => {
  if (!instance.isActive) return '非活跃';
  if (instance.lastSyncAt) return '已同步';
  return '未同步';
};

const getSyncTypeColor = (type: string) => {
  const colors = {
    incremental: 'blue',
    full: 'green',
    compensation: 'orange',
  };
  return colors[type] || 'default';
};

const getSyncTypeText = (type: string) => {
  const texts = {
    incremental: '增量同步',
    full: '全量同步',
    compensation: '补偿同步',
  };
  return texts[type] || type;
};

const getSyncStatusColor = (status: string) => {
  const colors = {
    running: 'processing',
    success: 'success',
    failed: 'error',
    pending: 'warning',
  };
  return colors[status] || 'default';
};

const getSyncStatusText = (status: string) => {
  const texts = {
    running: '运行中',
    success: '成功',
    failed: '失败',
    pending: '等待中',
  };
  return texts[status] || status;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

const formatDuration = (duration: number) => {
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${Math.round(duration / 1000)}s`;
  return `${Math.round(duration / 60000)}m`;
};

// 生命周期
onMounted(() => {
  refreshSyncHistory();
});
</script>

<style scoped>
.gitlab-sync-tab {
  padding: 0;
}

.sync-overview {
  margin-bottom: 24px;
}

.sync-card {
  margin-bottom: 24px;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.instance-details {
  flex: 1;
}

.instance-name {
  font-weight: 500;
  color: #262626;
}

.instance-url {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.text-muted {
  color: #8c8c8c;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

:deep(.ant-avatar) {
  background-color: #1890ff;
}
</style>
