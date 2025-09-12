<template>
  <a-card title="事项列表" :bordered="false">
    <a-space style="margin-bottom:12px">
      <a-input v-model:value="q" placeholder="搜索标题" allow-clear style="width:240px" />
      <a-select v-model:value="type" placeholder="类型" allow-clear style="width:140px">
        <a-select-option value="task">任务</a-select-option>
        <a-select-option value="requirement">需求</a-select-option>
        <a-select-option value="bug">缺陷</a-select-option>
      </a-select>
      <a-select v-model:value="state" placeholder="状态" allow-clear style="width:140px">
        <a-select-option value="open">打开</a-select-option>
        <a-select-option value="in_progress">进行中</a-select-option>
        <a-select-option value="resolved">已解决</a-select-option>
        <a-select-option value="closed">已关闭</a-select-option>
      </a-select>
      <UserSelector 
        v-model="assigneeId" 
        placeholder="负责人" 
        :project-id="projectId"
        style="width:200px"
        allow-clear
      />
      <a-button type="primary" @click="load">搜索</a-button>
      <a-button type="primary" @click="showCreateModal">新建事项</a-button>
    </a-space>
    <a-table
      :columns="columns"
      :data-source="items"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="onTableChange"
    >
      <template #title="{ record }">
        <a v-if="record" @click="() => router.push(`/projects/${projectId}/issues/${record.id}`)">{{ record.title }}</a>
      </template>
      <template #assignee="{ record }">
        <span v-if="record.assigneeName">{{ record.assigneeName }}</span>
        <span v-else class="text-muted">未分配</span>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button type="link" size="small" @click="editIssue(record)">编辑</a-button>
          <a-button type="link" size="small" danger @click="deleteIssue(record)">删除</a-button>
        </a-space>
      </template>
      <template #summary>
        <a-table-summary fixed>
          <a-table-summary-row>
            <a-table-summary-cell :index="0" :col-span="3">合计</a-table-summary-cell>
            <a-table-summary-cell :index="3">{{ totalEstimated }}</a-table-summary-cell>
            <a-table-summary-cell :index="4">{{ totalActual }}</a-table-summary-cell>
          </a-table-summary-row>
        </a-table-summary>
      </template>
      <template #emptyText>
        <div style="padding:12px;">
          <div style="color:#999;margin-bottom:8px">暂无事项</div>
          <a-button type="link" @click="load">重试</a-button>
        </div>
      </template>
    </a-table>

    <!-- 创建/编辑事项模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑事项' : '新建事项'"
      :confirm-loading="modalLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="600px"
    >
      <a-form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="标题" required>
          <a-input v-model:value="formData.title" placeholder="请输入事项标题" />
        </a-form-item>
        
        <a-form-item label="类型" required>
          <a-select v-model:value="formData.type" placeholder="请选择类型">
            <a-select-option value="task">任务</a-select-option>
            <a-select-option value="requirement">需求</a-select-option>
            <a-select-option value="bug">缺陷</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="负责人">
          <UserSelector 
            v-model="formData.assigneeId" 
            placeholder="请选择负责人" 
            :project-id="projectId"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="报告人">
          <UserSelector 
            v-model="formData.reporterId" 
            placeholder="请选择报告人" 
            :project-id="projectId"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="状态">
          <a-select v-model:value="formData.state" placeholder="请选择状态">
            <a-select-option value="open">打开</a-select-option>
            <a-select-option value="in_progress">进行中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
            <a-select-option value="closed">已关闭</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="预估工时">
          <a-input-number 
            v-model:value="formData.estimatedHours" 
            placeholder="预估工时（小时）" 
            :min="0" 
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="实际工时">
          <a-input-number 
            v-model:value="formData.actualHours" 
            placeholder="实际工时（小时）" 
            :min="0" 
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="描述">
          <SimpleMarkdownEditor 
            v-model="formData.description" 
            placeholder="请输入事项描述（支持Markdown格式）" 
            :rows="6"
            :project-id="projectId"
            :issue-id="editingId"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import http from '../api/http';
import { useRoute, useRouter } from 'vue-router';
import { useLoading } from '../composables/useLoading';
import { message, Modal } from 'ant-design-vue';
import UserSelector from '../components/UserSelector.vue';
import SimpleMarkdownEditor from '../components/SimpleMarkdownEditor.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const { loading, withLoading } = useLoading();
const items = ref<any[]>([]);
const q = ref('');
const type = ref<string | undefined>();
const state = ref<string | undefined>();
const assigneeId = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<'ascend' | 'descend' | undefined>(undefined);

// 模态框相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);
const editingId = ref<string | undefined>();

// 表单数据
const formData = reactive({
  title: '',
  type: 'task' as 'task' | 'requirement' | 'bug',
  assigneeId: undefined as string | undefined,
  reporterId: undefined as string | undefined,
  state: 'open',
  estimatedHours: undefined as number | undefined,
  actualHours: undefined as number | undefined,
  description: '',
});

const columns = [
  { 
    title: '标题', 
    dataIndex: 'title',
    key: 'title',
    slots: { customRender: 'title' },
    sorter: true,
  },
  { title: '类型', dataIndex: 'type' },
  { title: '状态', dataIndex: 'state', sorter: true },
  { 
    title: '负责人', 
    dataIndex: 'assigneeId',
    key: 'assignee',
    slots: { customRender: 'assignee' },
  },
  { title: '预估(小时)', dataIndex: 'estimatedHours', sorter: true },
  { title: '实际(小时)', dataIndex: 'actualHours', sorter: true },
  { 
    title: '操作', 
    key: 'actions',
    slots: { customRender: 'actions' },
    width: 120,
  },
];

const totalEstimated = ref(0);
const totalActual = ref(0);

async function load() {
  await withLoading(async () => {
    try {
      const { current, pageSize } = pagination.value as any;
      const res = await http.get(`/projects/${projectId}/issues`, { params: { 
        page: current, 
        pageSize, 
        q: q.value, 
        type: type.value,
        state: state.value,
        assigneeId: assigneeId.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value === 'ascend' ? 'ASC' : sortOrder.value === 'descend' ? 'DESC' : undefined,
      } });
     
      items.value = res.data.data?.items || [];
      pagination.value.total = res.data.data?.total || 0;
      totalEstimated.value = res.data.data?.totalEstimated || 0;
      totalActual.value = res.data.data?.totalActual || 0;
    } catch (e) {
      message.error('加载事项失败');
      items.value = []; // 确保在出错时清空数据
    }
  });
}

function onTableChange(p: any, _filters: any, sorter: any) {
  pagination.value = { ...pagination.value, current: p.current, pageSize: p.pageSize } as any;
  if (Array.isArray(sorter)) {
    const s = sorter[0] || {};
    sortField.value = s.field;
    sortOrder.value = s.order;
  } else {
    sortField.value = sorter?.field;
    sortOrder.value = sorter?.order;
  }
  load();
}

// 显示创建模态框
function showCreateModal() {
  isEdit.value = false;
  editingId.value = undefined;
  resetForm();
  modalVisible.value = true;
}

// 编辑事项
function editIssue(record: any) {
  isEdit.value = true;
  editingId.value = record.id;
  Object.assign(formData, {
    title: record.title,
    type: record.type,
    assigneeId: record.assigneeId,
    reporterId: record.reporterId,
    state: record.state,
    estimatedHours: record.estimatedHours,
    actualHours: record.actualHours,
    description: record.description || '',
  });
  modalVisible.value = true;
}

// 删除事项
function deleteIssue(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除事项"${record.title}"吗？`,
    onOk: async () => {
      try {
        await http.delete(`/projects/${projectId}/issues/${record.id}`);
        message.success('删除成功');
        load();
      } catch (e) {
        message.error('删除失败');
      }
    },
  });
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    title: '',
    type: 'task',
    assigneeId: undefined,
    reporterId: undefined,
    state: 'open',
    estimatedHours: undefined,
    actualHours: undefined,
    description: '',
  });
}

// 提交表单
async function handleSubmit() {
  if (!formData.title.trim()) {
    message.error('请输入事项标题');
    return;
  }

  modalLoading.value = true;
  try {
    const data = {
      ...formData,
      projectId,
    };

    if (isEdit.value && editingId.value) {
      await http.put(`/projects/${projectId}/issues/${editingId.value}`, data);
      message.success('更新成功');
    } else {
      await http.post(`/projects/${projectId}/issues`, data);
      message.success('创建成功');
    }

    modalVisible.value = false;
    load();
  } catch (e) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    modalLoading.value = false;
  }
}

// 取消
function handleCancel() {
  modalVisible.value = false;
  resetForm();
}

onMounted(load);
</script>

<style scoped>
.text-muted {
  color: #999;
}
</style>


