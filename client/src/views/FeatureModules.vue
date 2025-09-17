<template>
  <a-card title="功能模块管理" :bordered="false">
    <a-space style="margin-bottom: 12px">
      <a-input
        v-model:value="searchKeyword"
        placeholder="搜索功能模块名称"
        allow-clear
        style="width: 240px"
        @press-enter="loadFeatureModules"
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
      <a-button type="primary" @click="loadFeatureModules">搜索</a-button>
      <a-button type="primary" @click="showCreateModal">新建功能模块</a-button>
    </a-space>

    <!-- 功能模块列表 -->
    <a-table
      :columns="columns"
      :data-source="featureModules"
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

      <template #createdAt="{ record }">
        {{ formatDate(record.createdAt) }}
      </template>

      <template #updatedAt="{ record }">
        {{ formatDate(record.updatedAt) }}
      </template>

      <template #action="{ record }">
        <a-space>
          <a-button type="link" size="small" @click="editFeatureModule(record)">
            编辑
          </a-button>
          <a-button type="link" size="small" @click="viewDetail(record)">
            详情
          </a-button>
          <a-popconfirm
            title="确定要删除这个功能模块吗？"
            @confirm="deleteFeatureModule(record.id)"
          >
            <a-button type="link" size="small" danger>删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- 创建/编辑功能模块模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑功能模块' : '新建功能模块'"
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
        <a-form-item label="名称" name="title">
          <a-input v-model:value="formData.title" placeholder="请输入功能模块名称" />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入功能模块描述"
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

    <!-- 功能模块详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="功能模块详情"
      width="800px"
      :footer="null"
    >
      <div v-if="selectedFeatureModule" class="feature-module-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="名称">
            {{ selectedFeatureModule.title }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStateColor(selectedFeatureModule.state)">
              {{ getStateLabel(selectedFeatureModule.state) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="getPriorityColor(selectedFeatureModule.priority)">
              {{ getPriorityLabel(selectedFeatureModule.priority) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="负责人">
            <a-avatar :size="24" :src="selectedFeatureModule.assignee?.avatar">
              {{ selectedFeatureModule.assignee?.name?.charAt(0)?.toUpperCase() }}
            </a-avatar>
            <span style="margin-left: 8px">{{ selectedFeatureModule.assignee?.name || '未分配' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(selectedFeatureModule.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDate(selectedFeatureModule.updatedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="标签" :span="2">
            <a-tag v-for="label in selectedFeatureModule.labels" :key="label" color="blue">
              {{ label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">
            <div v-if="selectedFeatureModule.description" v-html="formatDescription(selectedFeatureModule.description)"></div>
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

interface FeatureModule {
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
  labels: string[];
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeatureModuleForm {
  title: string;
  description: string;
  state: string;
  priority?: string;
  assigneeId?: string;
  labels: string[];
  dueAt?: any;
}

const props = defineProps<{
  projectId: string;
}>();

const { loading, withLoading } = useLoading();

// 数据状态
const featureModules = ref<FeatureModule[]>([]);
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
const selectedFeatureModule = ref<FeatureModule | null>(null);

// 表单数据
const formData = ref<FeatureModuleForm>({
  title: '',
  description: '',
  state: 'open',
  priority: 'medium',
  assigneeId: undefined,
  labels: [],
  dueAt: undefined,
});

const formRef = ref();

// 表单验证规则
const formRules = {
  title: [{ required: true, message: '请输入功能模块名称', trigger: 'blur' }],
  state: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 表格列定义
const columns = [
  {
    title: '名称',
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

// 加载功能模块列表（包一层函数，避免将 Promise 赋值给变量后再调用）
const loadFeatureModules = () => withLoading(async () => {
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchKeyword.value,
      state: stateFilter.value,
      priority: priorityFilter.value,
    };

    const response = await http.get(`/feature-modules`, { params });
    const data = response.data;

    featureModules.value = data.items || [];
    pagination.total = data.total || 0;
  } catch (error) {
    message.error('加载功能模块列表失败');
    console.error('Load feature modules error:', error);
  }
});

// 表格变化处理
const onTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadFeatureModules();
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
    labels: [],
    dueAt: undefined,
  };
  modalVisible.value = true;
};

// 编辑功能模块
const editFeatureModule = (featureModule: FeatureModule) => {
  isEdit.value = true;
  formData.value = {
    title: featureModule.title,
    description: featureModule.description || '',
    state: featureModule.state,
    priority: featureModule.priority,
    assigneeId: featureModule.assigneeId,
    labels: [...featureModule.labels],
    dueAt: featureModule.dueAt ? new Date(featureModule.dueAt) : undefined,
  };
  modalVisible.value = true;
};

// 查看详情
const viewDetail = (featureModule: FeatureModule) => {
  selectedFeatureModule.value = featureModule;
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
      await http.put(`/feature-modules/${selectedFeatureModule.value?.id}`, submitData);
      message.success('功能模块更新成功');
    } else {
      await http.post('/feature-modules', { ...submitData, projectId: props.projectId });
      message.success('功能模块创建成功');
    }

    modalVisible.value = false;
    loadFeatureModules();
  } catch (error) {
    message.error(isEdit.value ? '更新功能模块失败' : '创建功能模块失败');
    console.error('Submit feature module error:', error);
  }
};

// 取消表单
const handleCancel = () => {
  modalVisible.value = false;
  formRef.value?.resetFields();
};

// 删除功能模块
const deleteFeatureModule = async (id: string) => {
  try {
    await http.delete(`/feature-modules/${id}`);
    message.success('功能模块删除成功');
    loadFeatureModules();
  } catch (error) {
    message.error('删除功能模块失败');
    console.error('Delete feature module error:', error);
  }
};

// 初始化
onMounted(() => {
  loadFeatureModules();
});
</script>

<style scoped>
.feature-module-detail {
  max-height: 600px;
  overflow-y: auto;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
