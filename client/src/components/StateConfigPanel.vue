<template>
  <div>
    <div style="margin-bottom: 16px; text-align: right;">
      <a-button type="primary" @click="showCreateModal">
        <template #icon>
          <PlusOutlined />
        </template>
        添加状态
      </a-button>
    </div>

    <a-list :data-source="states" :loading="loading" item-layout="horizontal">
      <template #renderItem="{ item, index }">
        <a-list-item>
          <a-list-item-meta>
            <template #title>
              <a-tag :color="item.color" style="font-size: 14px; padding: 4px 8px;">
                {{ item.stateName }}
              </a-tag>
              <span style="margin-left: 8px; color: #666;">{{ item.stateKey }}</span>
              <a-tag v-if="item.isInitial" color="green" size="small">初始状态</a-tag>
              <a-tag v-if="item.isFinal" color="red" size="small">最终状态</a-tag>
            </template>
          </a-list-item-meta>
          <template #actions>
            <a @click="moveUp(index)" :disabled="index === 0">上移</a>
            <a @click="moveDown(index)" :disabled="index === states.length - 1">下移</a>
            <a @click="editState(item)">编辑</a>
            <a @click="deleteState(item)" :disabled="!canDelete(item)" style="color: #ff4d4f;">删除</a>
          </template>
        </a-list-item>
      </template>
    </a-list>

    <!-- 创建/编辑状态弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑状态' : '添加状态'"
      :confirm-loading="modalLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="500px"
    >
      <a-form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="状态键" required>
          <a-input 
            v-model:value="formData.stateKey" 
            placeholder="如：draft, in_progress"
            :disabled="isEdit"
          />
        </a-form-item>
        
        <a-form-item label="状态名称" required>
          <a-input v-model:value="formData.stateName" placeholder="如：草稿、进行中" />
        </a-form-item>

        <a-form-item label="状态颜色">
          <a-color-picker v-model:value="formData.color" />
        </a-form-item>

        <a-form-item label="状态类型">
          <a-checkbox v-model:checked="formData.isInitial">初始状态</a-checkbox>
          <a-checkbox v-model:checked="formData.isFinal" style="margin-left: 16px;">最终状态</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import http from '../api/http';
import { message, Modal } from 'ant-design-vue';

interface IssueState {
  id: string;
  stateKey: string;
  stateName: string;
  color: string;
  isInitial: boolean;
  isFinal: boolean;
  sortOrder: number;
}

interface Props {
  projectId: string;
  issueType: 'requirement' | 'task' | 'bug';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'state-changed': [];
}>();

const states = ref<IssueState[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);
const editingId = ref<string | undefined>();

const formData = reactive({
  stateKey: '',
  stateName: '',
  color: '#1890ff',
  isInitial: false,
  isFinal: false,
});

async function loadStates() {
  loading.value = true;
  try {
    const res = await http.get(`/projects/${props.projectId}/issue-states`, {
      params: { type: props.issueType }
    });
    states.value = res.data.data || [];
  } catch (e) {
    message.error('加载状态列表失败');
    states.value = [];
  } finally {
    loading.value = false;
  }
}

function showCreateModal() {
  isEdit.value = false;
  editingId.value = undefined;
  resetForm();
  modalVisible.value = true;
}

function editState(state: IssueState) {
  isEdit.value = true;
  editingId.value = state.id;
  Object.assign(formData, {
    stateKey: state.stateKey,
    stateName: state.stateName,
    color: state.color,
    isInitial: state.isInitial,
    isFinal: state.isFinal,
  });
  modalVisible.value = true;
}

function deleteState(state: IssueState) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除状态"${state.stateName}"吗？`,
    onOk: async () => {
      try {
        await http.delete(`/projects/${props.projectId}/issue-states/${state.id}`);
        message.success('删除成功');
        loadStates();
        emit('state-changed');
      } catch (e: any) {
        message.error(e?.response?.data?.message || '删除失败');
      }
    },
  });
}

function canDelete(state: IssueState): boolean {
  // 这里应该检查状态是否被使用
  // 暂时返回 true，实际实现中需要调用 API 检查
  return true;
}

function moveUp(index: number) {
  if (index > 0) {
    const temp = states.value[index];
    states.value[index] = states.value[index - 1];
    states.value[index - 1] = temp;
    updateSortOrder();
  }
}

function moveDown(index: number) {
  if (index < states.value.length - 1) {
    const temp = states.value[index];
    states.value[index] = states.value[index + 1];
    states.value[index + 1] = temp;
    updateSortOrder();
  }
}

async function updateSortOrder() {
  try {
    const stateOrder = states.value.map(state => state.stateKey);
    await http.put(`/projects/${props.projectId}/issue-states/reorder`, {
      issueType: props.issueType,
      stateOrder,
    });
    message.success('排序已更新');
  } catch (e) {
    message.error('更新排序失败');
  }
}

function resetForm() {
  Object.assign(formData, {
    stateKey: '',
    stateName: '',
    color: '#1890ff',
    isInitial: false,
    isFinal: false,
  });
}

async function handleSubmit() {
  if (!formData.stateKey || !formData.stateName) {
    message.error('请填写完整信息');
    return;
  }

  modalLoading.value = true;
  try {
    if (isEdit.value && editingId.value) {
      await http.put(`/projects/${props.projectId}/issue-states/${editingId.value}`, {
        stateName: formData.stateName,
        color: formData.color,
        isInitial: formData.isInitial,
        isFinal: formData.isFinal,
      });
      message.success('更新成功');
    } else {
      await http.post(`/projects/${props.projectId}/issue-states`, {
        issueType: props.issueType,
        stateKey: formData.stateKey,
        stateName: formData.stateName,
        color: formData.color,
        isInitial: formData.isInitial,
        isFinal: formData.isFinal,
      });
      message.success('创建成功');
    }

    modalVisible.value = false;
    loadStates();
    emit('state-changed');
  } catch (e: any) {
    message.error(e?.response?.data?.message || (isEdit.value ? '更新失败' : '创建失败'));
  } finally {
    modalLoading.value = false;
  }
}

function handleCancel() {
  modalVisible.value = false;
  resetForm();
}

onMounted(() => {
  loadStates();
});
</script>

<style scoped>
.ant-list-item {
  padding: 12px 0;
}

.ant-list-item-meta-title {
  margin-bottom: 4px;
}

.ant-tag {
  margin-right: 8px;
}
</style>