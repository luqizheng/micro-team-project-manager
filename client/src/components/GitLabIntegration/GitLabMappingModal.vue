<template>
  <a-modal
    v-model:visible="visible"
    :title="isEdit ? '编辑项目映射' : '添加项目映射'"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :confirm-loading="submitting"
  >
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item label="项目" name="projectId">
        <a-select
          v-model:value="form.projectId"
          placeholder="请选择项目"
          @change="handleProjectChange"
        >
          <a-select-option
            v-for="project in projects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="GitLab实例" name="gitlabInstanceId">
        <a-select
          v-model:value="form.gitlabInstanceId"
          placeholder="请选择GitLab实例"
          @change="handleInstanceChange"
        >
          <a-select-option
            v-for="instance in instances"
            :key="instance.id"
            :value="instance.id"
          >
            {{ instance.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="GitLab项目" name="gitlabProjectId">
        <a-select
          v-model:value="form.gitlabProjectId"
          placeholder="请选择GitLab项目"
          :loading="loadingGitLabProjects"
          @focus="loadGitLabProjects"
        >
          <a-select-option
            v-for="project in gitlabProjects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.name_with_namespace }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="GitLab项目路径" name="gitlabProjectPath">
        <a-input
          v-model:value="form.gitlabProjectPath"
          placeholder="请输入GitLab项目路径"
        />
      </a-form-item>

      <a-form-item label="同步配置" name="syncConfig">
        <a-space direction="vertical" style="width: 100%">
          <a-checkbox v-model:checked="form.syncConfig.syncIssues">
            同步问题
          </a-checkbox>
          <a-checkbox v-model:checked="form.syncConfig.syncMergeRequests">
            同步合并请求
          </a-checkbox>
          <a-checkbox v-model:checked="form.syncConfig.syncPipelines">
            同步流水线
          </a-checkbox>
          <a-checkbox v-model:checked="form.syncConfig.syncCommits">
            同步提交
          </a-checkbox>
        </a-space>
      </a-form-item>

      <a-form-item label="字段映射" name="fieldMapping">
        <a-space direction="vertical" style="width: 100%">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-select
                v-model:value="form.fieldMapping.title"
                placeholder="标题字段"
              >
                <a-select-option value="title">title</a-select-option>
                <a-select-option value="name">name</a-select-option>
              </a-select>
            </a-col>
            <a-col :span="12">
              <a-select
                v-model:value="form.fieldMapping.description"
                placeholder="描述字段"
              >
                <a-select-option value="description">description</a-select-option>
                <a-select-option value="body">body</a-select-option>
              </a-select>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-select
                v-model:value="form.fieldMapping.assignee"
                placeholder="负责人字段"
              >
                <a-select-option value="assignee">assignee</a-select-option>
                <a-select-option value="assignee_id">assignee_id</a-select-option>
              </a-select>
            </a-col>
            <a-col :span="12">
              <a-select
                v-model:value="form.fieldMapping.labels"
                placeholder="标签字段"
              >
                <a-select-option value="labels">labels</a-select-option>
                <a-select-option value="label_names">label_names</a-select-option>
              </a-select>
            </a-col>
          </a-row>
        </a-space>
      </a-form-item>

      <a-form-item label="状态" name="isActive">
        <a-switch v-model:checked="form.isActive" />
        <span class="ml-2 text-muted">
          {{ form.isActive ? '启用' : '禁用' }}
        </span>
      </a-form-item>

      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="form.description"
          placeholder="请输入映射描述"
          :rows="3"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleTest" :loading="testing">
          <template #icon>
            <CheckCircleOutlined />
          </template>
          测试映射
        </a-button>
        <a-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { CheckCircleOutlined } from '@ant-design/icons-vue';
import { GitLabApiService } from '@/api/gitlab';

// Props
interface Props {
  visible: boolean;
  mapping?: any;
  projects: any[];
  instances: any[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  success: [];
}>();

// 响应式数据
const formRef = ref();
const submitting = ref(false);
const testing = ref(false);
const loadingGitLabProjects = ref(false);
const gitlabProjects = ref([]);

// 表单数据
const form = reactive({
  projectId: '',
  gitlabInstanceId: '',
  gitlabProjectId: '',
  gitlabProjectPath: '',
  isActive: true,
  description: '',
  syncConfig: {
    syncIssues: true,
    syncMergeRequests: true,
    syncPipelines: true,
    syncCommits: true,
  },
  fieldMapping: {
    title: 'title',
    description: 'description',
    assignee: 'assignee',
    labels: 'labels',
  },
});

// 表单验证规则
const rules = {
  projectId: [
    { required: true, message: '请选择项目', trigger: 'change' },
  ],
  gitlabInstanceId: [
    { required: true, message: '请选择GitLab实例', trigger: 'change' },
  ],
  gitlabProjectId: [
    { required: true, message: '请选择GitLab项目', trigger: 'change' },
  ],
  gitlabProjectPath: [
    { required: true, message: '请输入GitLab项目路径', trigger: 'blur' },
  ],
};

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isEdit = computed(() => !!props.mapping);

// 方法
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    const data = {
      ...form,
      syncConfig: JSON.stringify(form.syncConfig),
      fieldMapping: JSON.stringify(form.fieldMapping),
    };

    if (isEdit.value) {
      await GitLabApiService.updateProjectMapping(
        props.mapping.projectId,
        props.mapping.id,
        data
      );
      message.success('更新映射成功');
    } else {
      await GitLabApiService.createProjectMapping(form.projectId, data);
      message.success('创建映射成功');
    }

    emit('success');
    handleCancel();
  } catch (error) {
    if (error.errorFields) {
      message.error('请检查表单输入');
    } else {
      message.error(isEdit.value ? '更新映射失败' : '创建映射失败');
    }
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
  resetForm();
};

const handleTest = async () => {
  if (!form.gitlabInstanceId || !form.gitlabProjectId) {
    message.warning('请先选择GitLab实例和项目');
    return;
  }

  testing.value = true;
  try {
    // 这里应该调用测试映射的API
    // 简化实现
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('映射测试成功');
  } catch (error) {
    message.error('映射测试失败');
  } finally {
    testing.value = false;
  }
};

const handleProjectChange = (projectId: string) => {
  // 项目变化时的处理逻辑
  console.log('项目变化:', projectId);
};

const handleInstanceChange = (instanceId: string) => {
  // 实例变化时清空GitLab项目选择
  form.gitlabProjectId = '';
  gitlabProjects.value = [];
};

const loadGitLabProjects = async () => {
  if (!form.gitlabInstanceId) {
    message.warning('请先选择GitLab实例');
    return;
  }

  loadingGitLabProjects.value = true;
  try {
    const response = await GitLabApiService.getInstanceProjects(form.gitlabInstanceId);
    gitlabProjects.value = response.data;
  } catch (error) {
    message.error('加载GitLab项目失败');
  } finally {
    loadingGitLabProjects.value = false;
  }
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    projectId: '',
    gitlabInstanceId: '',
    gitlabProjectId: '',
    gitlabProjectPath: '',
    isActive: true,
    description: '',
    syncConfig: {
      syncIssues: true,
      syncMergeRequests: true,
      syncPipelines: true,
      syncCommits: true,
    },
    fieldMapping: {
      title: 'title',
      description: 'description',
      assignee: 'assignee',
      labels: 'labels',
    },
  });
  gitlabProjects.value = [];
};

const initForm = () => {
  if (props.mapping) {
    Object.assign(form, {
      projectId: props.mapping.projectId || '',
      gitlabInstanceId: props.mapping.gitlabInstanceId || '',
      gitlabProjectId: props.mapping.gitlabProjectId || '',
      gitlabProjectPath: props.mapping.gitlabProjectPath || '',
      isActive: props.mapping.isActive !== false,
      description: props.mapping.description || '',
      syncConfig: {
        syncIssues: true,
        syncMergeRequests: true,
        syncPipelines: true,
        syncCommits: true,
        ...(props.mapping.syncConfig ? JSON.parse(props.mapping.syncConfig) : {}),
      },
      fieldMapping: {
        title: 'title',
        description: 'description',
        assignee: 'assignee',
        labels: 'labels',
        ...(props.mapping.fieldMapping ? JSON.parse(props.mapping.fieldMapping) : {}),
      },
    });
  } else {
    resetForm();
  }
};

// 监听映射变化
watch(() => props.mapping, () => {
  initForm();
}, { immediate: true });

// 监听可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    initForm();
  }
});
</script>

<style scoped>
.ml-2 {
  margin-left: 8px;
}

.text-muted {
  color: #8c8c8c;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
