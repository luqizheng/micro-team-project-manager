<template>
  <div class="column-management">
    <div class="column-header">
      <a-button type="primary" @click="showCreateModal">
        <template #icon>
          <PlusOutlined />
        </template>
        新建列
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="boardColumns"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #name="{ record }">
        <div class="column-name">
          <div
            class="color-indicator"
            :style="{ backgroundColor: record.color }"
          ></div>
          <span>{{ record.name }}</span>
        </div>
      </template>

      <template #wipLimit="{ record }">
        <span v-if="record.wipLimit">{{ record.wipLimit }}</span>
        <span v-else class="text-muted">无限制</span>
      </template>

      <template #actions="{ record }">
        <a-space>
          <a-button type="link" size="small" @click="editColumn(record)">
            编辑
          </a-button>
          <a-button
            type="link"
            size="small"
            danger
            @click="deleteColumn(record)"
          >
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 创建/编辑列模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑列' : '新建列'"
      :confirm-loading="modalLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="列名称" required>
          <a-input
            v-model:value="formData.name"
            placeholder="请输入列名称"
          />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入列描述（可选）"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="状态映射" required>
          <a-select
            v-model:value="formData.stateMapping"
            placeholder="请选择状态映射"
          >
            <a-select-option
              v-for="state in availableStates"
              :key="state.stateKey"
              :value="state.stateKey"
            >
              {{ state.stateName }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="WIP限制">
          <a-input-number
            v-model:value="formData.wipLimit"
            placeholder="WIP限制（可选）"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="颜色">
          <a-color-picker
            v-model:value="formData.color"
            :show-text="true"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import http from '../api/http';
import { useLoading } from '../composables/useLoading';

const props = defineProps<{
  boardId: string;
  projectId: string;
}>();

const emit = defineEmits<{
  columnUpdated: [];
}>();

const { loading, withLoading } = useLoading();

// 数据状态
const boardColumns = ref<any[]>([]);
const availableStates = ref<any[]>([]);
const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);
const editingId = ref<string | undefined>();

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  stateMapping: '',
  wipLimit: undefined as number | undefined,
  color: '#1890ff'
});

// 表格列配置
const columns = [
  {
    title: '列名称',
    dataIndex: 'name',
    key: 'name',
    slots: { customRender: 'name' }
  },
  {
    title: '状态映射',
    dataIndex: 'stateMapping',
    key: 'stateMapping'
  },
  {
    title: 'WIP限制',
    dataIndex: 'wipLimit',
    key: 'wipLimit',
    slots: { customRender: 'wipLimit' }
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    key: 'sortOrder'
  },
  {
    title: '操作',
    key: 'actions',
    slots: { customRender: 'actions' },
    width: 120
  }
];

// 加载列列表
async function loadColumns() {
  await withLoading(async () => {
    try {
      const res = await http.get(`/projects/${props.projectId}/boards/${props.boardId}`);
      boardColumns.value = res.data.data?.columns || [];
    } catch (e) {
      message.error('加载列列表失败');
    }
  });
}

// 加载可用状态
async function loadAvailableStates() {
  try {
    const res = await http.get(`/projects/${props.projectId}/issue-states`);
    const allStates = res.data.data;
    availableStates.value = [
      ...(allStates.task || []),
      ...(allStates.requirement || []),
      ...(allStates.bug || [])
    ];
  } catch (e) {
    message.error('加载状态列表失败');
  }
}

// 显示创建模态框
function showCreateModal() {
  isEdit.value = false;
  editingId.value = undefined;
  resetForm();
  modalVisible.value = true;
}

// 编辑列
function editColumn(record: any) {
  isEdit.value = true;
  editingId.value = record.id;
  Object.assign(formData, {
    name: record.name,
    description: record.description || '',
    stateMapping: record.stateMapping,
    wipLimit: record.wipLimit,
    color: record.color
  });
  modalVisible.value = true;
}

// 删除列
function deleteColumn(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除列"${record.name}"吗？`,
    onOk: async () => {
      try {
        await http.delete(`/projects/${props.projectId}/boards/columns/${record.id}`);
        message.success('删除成功');
        loadColumns();
      } catch (e) {
        message.error('删除失败');
      }
    }
  });
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    name: '',
    description: '',
    stateMapping: '',
    wipLimit: undefined,
    color: '#1890ff'
  });
}

// 提交表单
async function handleSubmit() {
  if (!formData.name.trim()) {
    message.error('请输入列名称');
    return;
  }

  if (!formData.stateMapping) {
    message.error('请选择状态映射');
    return;
  }

  modalLoading.value = true;
  try {
    const data = {
      ...formData,
      boardId: props.boardId
    };

    if (isEdit.value && editingId.value) {
      await http.put(`/projects/${props.projectId}/boards/columns/${editingId.value}`, data);
      message.success('更新成功');
    } else {
      await http.post(`/projects/${props.projectId}/boards/${props.boardId}/columns`, data);
      message.success('创建成功');
    }

    modalVisible.value = false;
    loadColumns();
    emit('columnUpdated');
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

onMounted(() => {
  loadColumns();
  loadAvailableStates();
});
</script>

<style scoped>
.column-management {
  padding: 16px 0;
}

.column-header {
  margin-bottom: 16px;
}

.column-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.text-muted {
  color: #999;
}
</style>
