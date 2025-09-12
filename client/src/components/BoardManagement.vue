<template>
  <div class="board-management">
    <div class="board-header">
      <a-button type="primary" @click="showCreateModal">
        <template #icon>
          <PlusOutlined />
        </template>
        新建看板
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="boards"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #name="{ record }">
        <div class="board-name">
          <span>{{ record.name }}</span>
          <a-tag v-if="record.isDefault" color="blue" size="small">默认</a-tag>
        </div>
      </template>

      <template #actions="{ record }">
        <a-space>
          <a-button type="link" size="small" @click="editBoard(record)">
            编辑
          </a-button>
          <a-button
            v-if="!record.isDefault"
            type="link"
            size="small"
            danger
            @click="deleteBoard(record)"
          >
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 创建/编辑看板模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑看板' : '新建看板'"
      :confirm-loading="modalLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <a-form
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="看板名称" required>
          <a-input
            v-model:value="formData.name"
            placeholder="请输入看板名称"
          />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入看板描述（可选）"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="设为默认">
          <a-switch v-model:checked="formData.isDefault" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import http from '../api/http';
import { useLoading } from '../composables/useLoading';

const props = defineProps<{
  projectId: string;
}>();

const emit = defineEmits<{
  boardCreated: [];
  boardUpdated: [];
}>();

const { loading, withLoading } = useLoading();

// 数据状态
const boards = ref<any[]>([]);
const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);
const editingId = ref<string | undefined>();

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  isDefault: false
});

// 表格列配置
const columns = [
  {
    title: '看板名称',
    dataIndex: 'name',
    key: 'name',
    slots: { customRender: 'name' }
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    customRender: ({ text }: { text: string }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'actions',
    slots: { customRender: 'actions' },
    width: 120
  }
];

// 加载看板列表
async function loadBoards() {
  await withLoading(async () => {
    try {
      const res = await http.get(`/projects/${props.projectId}/boards`);
      boards.value = res.data.data || [];
    } catch (e) {
      message.error('加载看板列表失败');
    }
  });
}

// 显示创建模态框
function showCreateModal() {
  isEdit.value = false;
  editingId.value = undefined;
  resetForm();
  modalVisible.value = true;
}

// 编辑看板
function editBoard(record: any) {
  isEdit.value = true;
  editingId.value = record.id;
  Object.assign(formData, {
    name: record.name,
    description: record.description || '',
    isDefault: record.isDefault
  });
  modalVisible.value = true;
}

// 删除看板
function deleteBoard(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除看板"${record.name}"吗？`,
    onOk: async () => {
      try {
        await http.delete(`/projects/${props.projectId}/boards/${record.id}`);
        message.success('删除成功');
        loadBoards();
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
    isDefault: false
  });
}

// 提交表单
async function handleSubmit() {
  if (!formData.name.trim()) {
    message.error('请输入看板名称');
    return;
  }

  modalLoading.value = true;
  try {
    const data = {
      ...formData,
      projectId: props.projectId
    };

    if (isEdit.value && editingId.value) {
      await http.put(`/projects/${props.projectId}/boards/${editingId.value}`, data);
      message.success('更新成功');
      emit('boardUpdated');
    } else {
      await http.post(`/projects/${props.projectId}/boards`, data);
      message.success('创建成功');
      emit('boardCreated');
    }

    modalVisible.value = false;
    loadBoards();
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
  loadBoards();
});
</script>

<style scoped>
.board-management {
  padding: 16px 0;
}

.board-header {
  margin-bottom: 16px;
}

.board-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
