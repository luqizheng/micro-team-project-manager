<template>
  <a-card title="任务管理" :bordered="false">
    <a-space style="margin-bottom: 12px">
      <a-input
        v-model:value="searchKeyword"
        placeholder="搜索任务标题"
        allow-clear
        style="width: 240px"
        @press-enter="loadTasks"
      />
      <a-select
        v-model:value="stateFilter"
        placeholder="状态"
        allow-clear
        style="width: 140px"
      >
        <a-select-option value="open">开放</a-select-option>
        <a-select-option value="in_progress">进行中</a-select-option>
        <a-select-option value="closed">已关闭</a-select-option>
      </a-select>
      <a-select
        v-model:value="priorityFilter"
        placeholder="优先级"
        allow-clear
        style="width: 140px"
      >
        <a-select-option value="low">低</a-select-option>
        <a-select-option value="medium">中</a-select-option>
        <a-select-option value="high">高</a-select-option>
        <a-select-option value="urgent">紧急</a-select-option>
      </a-select>
      <a-button type="primary" @click="loadTasks">搜索</a-button>
      <a-button type="primary" @click="showCreateModal">新建任务</a-button>
    </a-space>

    <!-- 任务列表 -->
    <a-table
      :columns="columns"
      :data-source="tasks"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="onTableChange"
    >
      <template #title="{ record }">
        <a-button type="link" @click="viewDetail(record)">
          {{ record.title }}
        </a-button>
      </template>

      <template #state="{ record }">
        <a-tag :color="getStateColor(record.state)">
          {{ getStateLabel(record.state) }}
        </a-tag>
      </template>

      <template #priority="{ record }">
        <a-tag :color="getPriorityColor(record.priority)">
          {{ getPriorityLabel(record.priority) }}
        </a-tag>
      </template>

      <template #assignee="{ record }">
        <a-avatar :size="24" :src="record.assignee?.avatar">
          {{ record.assignee?.name?.charAt(0)?.toUpperCase() }}
        </a-avatar>
        <span style="margin-left: 8px">{{ record.assignee?.name || '未分配' }}</span>
      </template>

      <template #estimatedHours="{ record }">
        {{ record.estimatedHours || 0 }}h
      </template>

      <template #actualHours="{ record }">
        {{ record.actualHours || 0 }}h
      </template>

      <template #createdAt="{ record }">
        {{ formatDate(record.createdAt) }}
      </template>

      <template #updatedAt="{ record }">
        {{ formatDate(record.updatedAt) }}
      </template>

      <template #action="{ record }">
        <a-space>
          <a-button type="link" size="small" @click="editTask(record)">
            编辑
          </a-button>
          <a-button type="link" size="small" @click="viewDetail(record)">
            详情
          </a-button>
          <a-popconfirm
            title="确定要删除这个任务吗？"
            @confirm="deleteTask(record.id)"
          >
            <a-button type="link" size="small" danger>删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 创建/编辑任务模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑任务' : '新建任务'"
      width="800px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <a-form-item label="标题" name="title">
          <a-input v-model:value="formData.title" placeholder="请输入任务标题" />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入任务描述"
            :rows="4"
          />
        </a-form-item>

        <a-form-item label="状态" name="state">
          <a-select v-model:value="formData.state" placeholder="请选择状态">
            <a-select-option value="open">开放</a-select-option>
            <a-select-option value="in_progress">进行中</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="优先级" name="priority">
          <a-select v-model:value="formData.priority" placeholder="请选择优先级">
            <a-select-option value="low">低</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="urgent">紧急</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="负责人" name="assigneeId">
          <UserSelector
            v-model="formData.assigneeId"
            :project-id="projectId"
            placeholder="请选择负责人"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="预估工时" name="estimatedHours">
          <a-input-number
            v-model:value="formData.estimatedHours"
            placeholder="请输入预估工时"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="实际工时" name="actualHours">
          <a-input-number
            v-model:value="formData.actualHours"
            placeholder="请输入实际工时"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="标签" name="labels">
          <a-select
            v-model:value="formData.labels"
            mode="tags"
            placeholder="请输入标签"
            :token-separators="[',']"
          />
        </a-form-item>

        <a-form-item label="截止日期" name="dueAt">
          <a-date-picker
            v-model:value="formData.dueAt"
            placeholder="请选择截止日期"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 任务详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="任务详情"
      width="800px"
      :footer="null"
    >
      <div v-if="selectedTask" class="task-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="标题">
            {{ selectedTask.title }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStateColor(selectedTask.state)">
              {{ getStateLabel(selectedTask.state) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="getPriorityColor(selectedTask.priority)">
              {{ getPriorityLabel(selectedTask.priority) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="负责人">
            <a-avatar :size="24" :src="selectedTask.assignee?.avatar">
              {{ selectedTask.assignee?.name?.charAt(0)?.toUpperCase() }}
            </a-avatar>
            <span style="margin-left: 8px">{{ selectedTask.assignee?.name || '未分配' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="预估工时">
            {{ selectedTask.estimatedHours || 0 }} 小时
          </a-descriptions-item>
          <a-descriptions-item label="实际工时">
            {{ selectedTask.actualHours || 0 }} 小时
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(selectedTask.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDate(selectedTask.updatedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="标签" :span="2">
            <a-tag v-for="label in selectedTask.labels" :key="label" color="blue">
              {{ label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">
            <div v-if="selectedTask.description" v-html="formatDescription(selectedTask.description)"></div>
            <span v-else class="text-gray-400">暂无描述</span>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import http from '../api/http';
import UserSelector from '../components/UserSelector.vue';
import { useLoading } from '../composables/useLoading';

interface Task {
  id: string;
  title: string;
  description?: string;
  state: string;
  priority?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskForm {
  title: string;
  description: string;
  state: string;
  priority?: string;
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  dueAt?: any;
}

const props = defineProps<{
  projectId: string;
}>();

const { loading, withLoading } = useLoading();

// 数据状态
const tasks = ref<Task[]>([]);
const searchKeyword = ref('');
const stateFilter = ref('');
const priorityFilter = ref('');

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 模态框状态
const modalVisible = ref(false);
const detailModalVisible = ref(false);
const isEdit = ref(false);
const selectedTask = ref<Task | null>(null);

// 表单数据
const formData = ref<TaskForm>({
  title: '',
  description: '',
  state: 'open',
  priority: 'medium',
  assigneeId: undefined,
  estimatedHours: undefined,
  actualHours: undefined,
  labels: [],
  dueAt: undefined,
});

const formRef = ref();

// 表单验证规则
const formRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  state: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    slots: { customRender: 'title' },
    width: 300,
  },
  {
    title: '状态',
    dataIndex: 'state',
    key: 'state',
    slots: { customRender: 'state' },
    width: 100,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    slots: { customRender: 'priority' },
    width: 100,
  },
  {
    title: '负责人',
    dataIndex: 'assignee',
    key: 'assignee',
    slots: { customRender: 'assignee' },
    width: 150,
  },
  {
    title: '预估工时',
    dataIndex: 'estimatedHours',
    key: 'estimatedHours',
    slots: { customRender: 'estimatedHours' },
    width: 100,
  },
  {
    title: '实际工时',
    dataIndex: 'actualHours',
    key: 'actualHours',
    slots: { customRender: 'actualHours' },
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    slots: { customRender: 'createdAt' },
    width: 120,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    slots: { customRender: 'updatedAt' },
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
    width: 200,
    fixed: 'right',
  },
];

// 状态颜色映射
const getStateColor = (state: string) => {
  const colors = {
    open: 'blue',
    in_progress: 'orange',
    closed: 'green',
  };
  return colors[state as keyof typeof colors] || 'default';
};

// 状态标签映射
const getStateLabel = (state: string) => {
  const labels = {
    open: '开放',
    in_progress: '进行中',
    closed: '已关闭',
  };
  return labels[state as keyof typeof labels] || state;
};

// 优先级颜色映射
const getPriorityColor = (priority?: string) => {
  const colors = {
    low: 'green',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  return colors[priority as keyof typeof colors] || 'default';
};

// 优先级标签映射
const getPriorityLabel = (priority?: string) => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority as keyof typeof labels] || priority || '未设置';
};

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

// 格式化描述
const formatDescription = (description: string) => {
  return description.replace(/\n/g, '<br>');
};

// 加载任务列表
const loadTasks = withLoading(async () => {
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchKeyword.value,
      state: stateFilter.value,
      priority: priorityFilter.value,
    };

    const response = await http.get(`/tasks`, { params });
    const data = response.data;

    tasks.value = data.items || [];
    pagination.total = data.total || 0;
  } catch (error) {
    message.error('加载任务列表失败');
    console.error('Load tasks error:', error);
  }
});

// 表格变化处理
const onTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadTasks();
};

// 显示创建模态框
const showCreateModal = () => {
  isEdit.value = false;
  formData.value = {
    title: '',
    description: '',
    state: 'open',
    priority: 'medium',
    assigneeId: undefined,
    estimatedHours: undefined,
    actualHours: undefined,
    labels: [],
    dueAt: undefined,
  };
  modalVisible.value = true;
};

// 编辑任务
const editTask = (task: Task) => {
  isEdit.value = true;
  formData.value = {
    title: task.title,
    description: task.description || '',
    state: task.state,
    priority: task.priority,
    assigneeId: task.assigneeId,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    labels: [...task.labels],
    dueAt: task.dueAt ? new Date(task.dueAt) : undefined,
  };
  modalVisible.value = true;
};

// 查看详情
const viewDetail = (task: Task) => {
  selectedTask.value = task;
  detailModalVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    
    const submitData = {
      ...formData.value,
      dueAt: formData.value.dueAt ? formData.value.dueAt.toISOString() : undefined,
    };

    if (isEdit.value) {
      await http.put(`/tasks/${selectedTask.value?.id}`, submitData);
      message.success('任务更新成功');
    } else {
      await http.post('/tasks', { ...submitData, projectId: props.projectId });
      message.success('任务创建成功');
    }

    modalVisible.value = false;
    loadTasks();
  } catch (error) {
    message.error(isEdit.value ? '更新任务失败' : '创建任务失败');
    console.error('Submit task error:', error);
  }
};

// 取消表单
const handleCancel = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
};

// 删除任务
const deleteTask = async (id: string) => {
  try {
    await http.delete(`/tasks/${id}`);
    message.success('任务删除成功');
    loadTasks();
  } catch (error) {
    message.error('删除任务失败');
    console.error('Delete task error:', error);
  }
};

// 初始化
onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.task-detail {
  max-height: 600px;
  overflow-y: auto;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
