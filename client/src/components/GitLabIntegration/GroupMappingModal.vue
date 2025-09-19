<template>
  <a-modal
    v-model:open="modalOpen"
    :title="isEdit ? '编辑分组映射' : '添加分组映射'"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
    width="600px"
  >
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      layout="vertical"
    >
      <a-form-item label="GitLab实例" name="gitlabInstanceId" required>
        <a-select
          v-model:value="form.gitlabInstanceId"
          placeholder="选择GitLab实例"
          :loading="instancesLoading"
          @change="onInstanceChange"
        >
          <a-select-option
            v-for="instance in instances"
            :key="instance.id"
            :value="instance.id"
          >
            {{ instance.name }} ({{ instance.baseUrl }})
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="GitLab分组" name="gitlabGroupId" required>
        <GroupSelector
          v-model:value="form.gitlabGroupId"
          :instance-id="form.gitlabInstanceId"
          :loading="groupsLoading"
          @change="onGroupChange"
        />
      </a-form-item>

      <a-form-item label="分组路径" name="gitlabGroupPath" required>
        <a-input
          v-model:value="form.gitlabGroupPath"
          placeholder="分组路径"
          :disabled="true"
        />
      </a-form-item>

      <a-form-item v-if="isEdit" label="状态" name="isActive">
        <a-switch
          v-model:checked="form.isActive"
          checked-children="激活"
          un-checked-children="禁用"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import http from '../../api/http';
import GroupSelector from './GroupSelector.vue';

interface GitLabInstance {
  id: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
}

interface GitLabGroup {
  id: number;
  name: string;
  path: string;
  fullPath: string;
  description?: string;
  visibility: string;
  projectsCount: number;
}

interface GroupMapping {
  id: string;
  projectId: string;
  gitlabInstanceId: string;
  gitlabGroupId: number;
  gitlabGroupPath: string;
  groupName: string;
  groupFullPath: string;
  groupDescription?: string;
  groupVisibility: string;
  groupProjectsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  projectId: string;
  mapping?: GroupMapping | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref();
const loading = ref(false);
const instancesLoading = ref(false);
const groupsLoading = ref(false);

const instances = ref<GitLabInstance[]>([]);
const selectedGroup = ref<GitLabGroup | null>(null);

const form = ref({
  gitlabInstanceId: '',
  gitlabGroupId: undefined as number | undefined,
  gitlabGroupPath: '',
  isActive: true,
});

const rules = {
  gitlabInstanceId: [
    { required: true, message: '请选择GitLab实例', trigger: 'change' },
  ],
  gitlabGroupId: [
    { required: true, message: '请选择GitLab分组', trigger: 'change' },
  ],
  gitlabGroupPath: [
    { required: true, message: '请输入分组路径', trigger: 'blur' },
  ],
};

const isEdit = computed(() => !!props.mapping);

const modalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

// 监听模态框打开
watch(() => props.open, (open) => {
  if (open) {
    if (props.mapping) {
      // 编辑模式
      form.value = {
        gitlabInstanceId: props.mapping.gitlabInstanceId,
        gitlabGroupId: props.mapping.gitlabGroupId,
        gitlabGroupPath: props.mapping.gitlabGroupPath,
        isActive: props.mapping.isActive,
      };
    } else {
      // 新增模式
      form.value = {
        gitlabInstanceId: '',
        gitlabGroupId: undefined,
        gitlabGroupPath: '',
        isActive: true,
      };
    }
  }
});

const loadInstances = async () => {
  instancesLoading.value = true;
  try {
    const response = await http.get('/gitlab/instances');
    instances.value = response.data.data.items || [];
  } catch (error: any) {
    message.error('加载GitLab实例失败');
    console.error('Load instances error:', error);
  } finally {
    instancesLoading.value = false;
  }
};

const onInstanceChange = (instanceId: string) => {
  form.value.gitlabGroupId = undefined;
  form.value.gitlabGroupPath = '';
  selectedGroup.value = null;
};

const onGroupChange = (group: GitLabGroup) => {
  selectedGroup.value = group;
  form.value.gitlabGroupPath = group.fullPath;
};

const handleOk = async () => {
  try {
    await formRef.value.validate();
    
    loading.value = true;

    const payload = {
      gitlabInstanceId: form.value.gitlabInstanceId,
      gitlabGroupId: form.value.gitlabGroupId,
      gitlabGroupPath: form.value.gitlabGroupPath,
    };

    if (isEdit.value && props.mapping) {
      // 编辑模式
      await http.put(`/projects/${props.projectId}/gitlab-groups/${props.mapping.id}`, {
        isActive: form.value.isActive,
      });
      message.success('更新成功');
    } else {
      // 新增模式
      await http.post(`/projects/${props.projectId}/gitlab-groups`, payload);
      message.success('创建成功');
    }

    emit('success');
    handleCancel();
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      return;
    }
    message.error(isEdit.value ? '更新失败' : '创建失败');
    console.error('Submit error:', error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  formRef.value?.resetFields();
  modalOpen.value = false;
};

onMounted(() => {
  loadInstances();
});
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 16px;
}
</style>
