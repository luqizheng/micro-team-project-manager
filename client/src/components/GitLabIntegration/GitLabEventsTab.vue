<template>
  <div class="gitlab-events-tab">
    <!-- 事件统计概览 -->
    <div class="events-overview">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="总事件数"
              :value="statistics.totalEvents"
              :loading="loading"
            >
              <template #prefix>
                <NotificationOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="处理成功"
              :value="statistics.successfulEvents"
              :loading="loading"
            >
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="处理失败"
              :value="statistics.failedEvents"
              :loading="loading"
            >
              <template #prefix>
                <CloseCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="处理中"
              :value="statistics.processingEvents"
              :loading="loading"
            >
              <template #prefix>
                <LoadingOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 事件列表 -->
    <div class="events-list">
      <a-card title="事件列表" class="events-card">
        <template #extra>
          <a-space>
            <a-select
              v-model:value="statusFilter"
              placeholder="状态筛选"
              allow-clear
              @change="handleFilter"
              style="width: 120px"
            >
              <a-select-option value="pending">等待中</a-select-option>
              <a-select-option value="processing">处理中</a-select-option>
              <a-select-option value="success">成功</a-select-option>
              <a-select-option value="failed">失败</a-select-option>
            </a-select>

            <a-select
              v-model:value="eventTypeFilter"
              placeholder="事件类型"
              allow-clear
              @change="handleFilter"
              style="width: 120px"
            >
              <a-select-option value="push">推送</a-select-option>
              <a-select-option value="merge_request">合并请求</a-select-option>
              <a-select-option value="issue">问题</a-select-option>
              <a-select-option value="pipeline">流水线</a-select-option>
            </a-select>

            <a-button @click="handleRefresh">
              <template #icon>
                <ReloadOutlined />
              </template>
              刷新
            </a-button>

            <a-button
              type="primary"
              :disabled="selectedEvents.length === 0"
              @click="handleBatchRetry"
            >
              <template #icon>
                <RetweetOutlined />
              </template>
              批量重试 ({{ selectedEvents.length }})
            </a-button>
          </a-space>
        </template>

        <a-table
          :columns="columns"
          :data-source="filteredEvents"
          :loading="loading"
          :pagination="pagination"
          :row-selection="rowSelection"
          row-key="id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'eventType'">
              <a-tag :color="getEventTypeColor(record.eventType)">
                {{ getEventTypeText(record.eventType) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>

            <template v-else-if="column.key === 'instance'">
              <div class="instance-info">
                <a-avatar :size="20" :src="record.instance?.avatar">
                  <template #icon>
                    <DatabaseOutlined />
                  </template>
                </a-avatar>
                <span class="instance-name">{{ record.instance?.name || '未知实例' }}</span>
              </div>
            </template>

            <template v-else-if="column.key === 'retryCount'">
              <a-badge
                :count="record.retryCount"
                :number-style="{ backgroundColor: record.retryCount > 3 ? '#ff4d4f' : '#52c41a' }"
              />
            </template>

            <template v-else-if="column.key === 'createdAt'">
              {{ formatDate(record.createdAt) }}
            </template>

            <template v-else-if="column.key === 'processedAt'">
              <span v-if="record.processedAt">
                {{ formatDate(record.processedAt) }}
              </span>
              <span v-else class="text-muted">未处理</span>
            </template>

            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-tooltip title="重试事件">
                  <a-button
                    type="text"
                    size="small"
                    @click="handleRetry(record)"
                    :disabled="record.status === 'processing'"
                  >
                    <template #icon>
                      <RetweetOutlined />
                    </template>
                  </a-button>
                </a-tooltip>

                <a-tooltip title="查看详情">
                  <a-button
                    type="text"
                    size="small"
                    @click="handleViewDetails(record)"
                  >
                    <template #icon>
                      <EyeOutlined />
                    </template>
                  </a-button>
                </a-tooltip>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 事件详情模态框 -->
    <a-modal
      v-model:visible="detailsVisible"
      title="事件详情"
      width="800px"
      :footer="null"
    >
      <div v-if="selectedEvent" class="event-details">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="事件ID">
            {{ selectedEvent.id }}
          </a-descriptions-item>
          <a-descriptions-item label="事件类型">
            <a-tag :color="getEventTypeColor(selectedEvent.eventType)">
              {{ getEventTypeText(selectedEvent.eventType) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(selectedEvent.status)">
              {{ getStatusText(selectedEvent.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="重试次数">
            {{ selectedEvent.retryCount }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(selectedEvent.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="处理时间">
            <span v-if="selectedEvent.processedAt">
              {{ formatDate(selectedEvent.processedAt) }}
            </span>
            <span v-else class="text-muted">未处理</span>
          </a-descriptions-item>
          <a-descriptions-item label="错误信息" :span="2">
            <pre v-if="selectedEvent.errorMessage" class="error-message">
              {{ selectedEvent.errorMessage }}
            </pre>
            <span v-else class="text-muted">无错误信息</span>
          </a-descriptions-item>
        </a-descriptions>

        <div class="event-payload">
          <h4>事件数据</h4>
          <pre class="payload-content">{{ JSON.stringify(selectedEvent.payload, null, 2) }}</pre>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  RetweetOutlined,
  DatabaseOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue';

// Props
interface Props {
  events: any[];
  statistics: any;
  loading: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  refresh: () => void;
  retry: (eventId: string) => void;
  'batch-retry': (eventIds: string[]) => void;
}>();

// 响应式数据
const statusFilter = ref('');
const eventTypeFilter = ref('');
const selectedEvents = ref<string[]>([]);
const detailsVisible = ref(false);
const selectedEvent = ref(null);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 行选择配置
const rowSelection = {
  selectedRowKeys: selectedEvents,
  onChange: (selectedRowKeys: string[]) => {
    selectedEvents.value = selectedRowKeys;
  },
  getCheckboxProps: (record: any) => ({
    disabled: record.status === 'processing',
  }),
};

// 表格列配置
const columns = [
  {
    title: '事件类型',
    key: 'eventType',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '实例',
    key: 'instance',
    width: 150,
  },
  {
    title: '重试次数',
    key: 'retryCount',
    width: 100,
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '处理时间',
    key: 'processedAt',
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
const filteredEvents = computed(() => {
  let filtered = props.events;

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(event => event.status === statusFilter.value);
  }

  // 事件类型筛选
  if (eventTypeFilter.value) {
    filtered = filtered.filter(event => event.eventType === eventTypeFilter.value);
  }

  // 更新分页总数
  pagination.value.total = filtered.length;

  return filtered;
});

// 方法
const handleFilter = () => {
  pagination.value.current = 1;
};

const handleRefresh = () => {
  emit('refresh');
};

const handleRetry = (event: any) => {
  emit('retry', event.id);
};

const handleBatchRetry = () => {
  if (selectedEvents.value.length === 0) {
    message.warning('请选择要重试的事件');
    return;
  }
  emit('batch-retry', selectedEvents.value);
  selectedEvents.value = [];
};

const handleViewDetails = (event: any) => {
  selectedEvent.value = event;
  detailsVisible.value = true;
};

const handleTableChange = (pag: any) => {
  pagination.value = { ...pagination.value, ...pag };
};

const getEventTypeColor = (type: string) => {
  const colors = {
    push: 'blue',
    merge_request: 'green',
    issue: 'orange',
    pipeline: 'purple',
  };
  return colors[type] || 'default';
};

const getEventTypeText = (type: string) => {
  const texts = {
    push: '推送',
    merge_request: '合并请求',
    issue: '问题',
    pipeline: '流水线',
  };
  return texts[type] || type;
};

const getStatusColor = (status: string) => {
  const colors = {
    pending: 'warning',
    processing: 'processing',
    success: 'success',
    failed: 'error',
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    pending: '等待中',
    processing: '处理中',
    success: '成功',
    failed: '失败',
  };
  return texts[status] || status;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

// 监听事件变化
watch(() => props.events, (newEvents) => {
  // 清除选中的事件
  selectedEvents.value = [];
}, { deep: true });
</script>

<style scoped>
.gitlab-events-tab {
  padding: 0;
}

.events-overview {
  margin-bottom: 24px;
}

.events-card {
  margin-bottom: 24px;
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

.event-details {
  padding: 16px 0;
}

.event-payload {
  margin-top: 24px;
}

.event-payload h4 {
  margin-bottom: 12px;
  color: #262626;
}

.payload-content {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.error-message {
  background: #fff2f0;
  color: #ff4d4f;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

:deep(.ant-avatar) {
  background-color: #1890ff;
}
</style>
