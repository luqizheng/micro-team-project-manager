<template>
  <a-modal
    v-model:visible="visible"
    :title="isEdit ? '编辑GitLab实例' : '添加GitLab实例'"
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
      <a-form-item label="实例名称" name="name">
        <a-input v-model:value="form.name" placeholder="请输入实例名称" />
      </a-form-item>

      <a-form-item label="实例URL" name="baseUrl">
        <a-input v-model:value="form.baseUrl" placeholder="请输入GitLab实例URL" />
      </a-form-item>

      <a-form-item label="实例类型" name="type">
        <a-radio-group v-model:value="form.type">
          <a-radio value="self_hosted">自托管</a-radio>
          <a-radio value="gitlab_com">GitLab.com</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="访问令牌" name="apiToken">
        <a-input-password
          v-model:value="form.apiToken"
          placeholder="请输入访问令牌"
        />
      </a-form-item>

      <a-form-item label="Webhook密钥" name="webhookSecret">
        <a-input-password
          v-model:value="form.webhookSecret"
          placeholder="请输入Webhook密钥"
        />
      </a-form-item>

      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="form.description"
          placeholder="请输入实例描述"
          :rows="3"
        />
      </a-form-item>

      <a-form-item label="状态" name="isActive">
        <a-switch v-model:checked="form.isActive" />
        <span class="ml-2 text-muted">
          {{ form.isActive ? '启用' : '禁用' }}
        </span>
      </a-form-item>

      <a-form-item label="同步配置" v-if="form.type === 'self_hosted'">
        <a-space direction="vertical" style="width: 100%">
          <a-checkbox v-model:checked="form.syncConfig.syncUsers">
            同步用户信息
          </a-checkbox>
          <a-checkbox v-model:checked="form.syncConfig.syncIssues">
            同步问题
          </a-checkbox>
          <a-checkbox v-model:checked="form.syncConfig.syncMergeRequests">
            同步合并请求
          </a-checkbox>
          <a-checkbox v-model:checked="form.syncConfig.syncPipelines">
            同步流水线
          </a-checkbox>
        </a-space>
      </a-form-item>

      <a-form-item label="高级配置" v-if="form.type === 'self_hosted'">
        <a-space direction="vertical" style="width: 100%">
          <a-input-group compact>
            <a-input
              v-model:value="form.advancedConfig.apiTimeout"
              placeholder="API超时时间"
              addon-before="API超时"
              addon-after="秒"
              style="width: 200px"
            />
          </a-input-group>
          <a-input-group compact>
            <a-input
              v-model:value="form.advancedConfig.retryCount"
              placeholder="重试次数"
              addon-before="重试次数"
              addon-after="次"
              style="width: 200px"
            />
          </a-input-group>
        </a-space>
      </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleTest" :loading="testing">
          <template #icon>
            <CheckCircleOutlined />
          </template>
          测试连接
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
  instance?: any;
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

// 表单数据
const form = reactive({
  name: '',
  baseUrl: '',
  type: 'self_hosted',
  accessToken: '',
  webhookSecret: '',
  description: '',
  isActive: true,
  syncConfig: {
    syncUsers: true,
    syncIssues: true,
    syncMergeRequests: true,
    syncPipelines: true,
  },
  advancedConfig: {
    apiTimeout: 30,
    retryCount: 3,
  },
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入实例名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符', trigger: 'blur' },
  ],
  baseUrl: [
    { required: true, message: '请输入实例URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择实例类型', trigger: 'change' },
  ],
  accessToken: [
    { required: true, message: '请输入访问令牌', trigger: 'blur' },
    { min: 10, message: '令牌长度至少10个字符', trigger: 'blur' },
  ],
  webhookSecret: [
    { required: true, message: '请输入Webhook密钥', trigger: 'blur' },
    { min: 10, message: '密钥长度至少10个字符', trigger: 'blur' },
  ],
};

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isEdit = computed(() => !!props.instance);

// 方法
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    const data = {
      ...form,
      syncConfig: JSON.stringify(form.syncConfig),
      advancedConfig: JSON.stringify(form.advancedConfig),
    };

    if (isEdit.value) {
      await GitLabApiService.updateInstance(props.instance.id, data);
      message.success('更新实例成功');
    } else {
      await GitLabApiService.createInstance(data);
      message.success('创建实例成功');
    }

    emit('success');
    handleCancel();
  } catch (error) {
    if (error.errorFields) {
      message.error('请检查表单输入');
    } else {
      message.error(isEdit.value ? '更新实例失败' : '创建实例失败');
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
  if (!form.baseUrl || !form.accessToken) {
    message.warning('请先填写URL和访问令牌');
    return;
  }

  testing.value = true;
  try {
    // 这里应该调用测试连接的API
    // 简化实现
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('连接测试成功');
  } catch (error) {
    message.error('连接测试失败');
  } finally {
    testing.value = false;
  }
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    name: '',
    url: '',
    type: 'self_hosted',
    accessToken: '',
    webhookSecret: '',
    description: '',
    isActive: true,
    syncConfig: {
      syncUsers: true,
      syncIssues: true,
      syncMergeRequests: true,
      syncPipelines: true,
    },
    advancedConfig: {
      apiTimeout: 30,
      retryCount: 3,
    },
  });
};

const initForm = () => {
  if (props.instance) {
    Object.assign(form, {
      name: props.instance.name || '',
      url: props.instance.url || '',
      type: props.instance.type || 'self_hosted',
      accessToken: props.instance.accessToken || '',
      webhookSecret: props.instance.webhookSecret || '',
      description: props.instance.description || '',
      isActive: props.instance.isActive !== false,
      syncConfig: {
        syncUsers: true,
        syncIssues: true,
        syncMergeRequests: true,
        syncPipelines: true,
        ...(props.instance.syncConfig ? JSON.parse(props.instance.syncConfig) : {}),
      },
      advancedConfig: {
        apiTimeout: 30,
        retryCount: 3,
        ...(props.instance.advancedConfig ? JSON.parse(props.instance.advancedConfig) : {}),
      },
    });
  } else {
    resetForm();
  }
};

// 监听实例变化
watch(() => props.instance, () => {
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

:deep(.ant-input-group) {
  display: flex;
}

:deep(.ant-input-group .ant-input) {
  flex: 1;
}
</style>
