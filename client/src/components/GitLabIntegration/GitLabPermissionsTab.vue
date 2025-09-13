<template>
  <div class="gitlab-permissions-tab">
    <!-- 权限概览 -->
    <div class="permissions-overview">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="当前角色"
              :value="permissions.role"
              :loading="loading"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="可访问实例"
              :value="permissions.accessibleInstances"
              :loading="loading"
            >
              <template #prefix>
                <DatabaseOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="可访问映射"
              :value="permissions.accessibleMappings"
              :loading="loading"
            >
              <template #prefix>
                <LinkOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="可执行同步"
              :value="permissions.canSync ? '是' : '否'"
              :loading="loading"
            >
              <template #prefix>
                <SyncOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 权限详情 -->
    <div class="permissions-details">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="我的权限" class="permissions-card">
            <template #extra>
              <a-button @click="handleRefresh">
                <template #icon>
                  <ReloadOutlined />
                </template>
                刷新
              </a-button>
            </template>

            <div class="permissions-list">
              <a-tag
                v-for="permission in permissions.permissions"
                :key="permission"
                color="blue"
                class="permission-tag"
              >
                {{ permission }}
              </a-tag>
            </div>
          </a-card>
        </a-col>

        <a-col :span="12">
          <a-card title="角色权限映射" class="permissions-card">
            <template #extra>
              <a-button @click="handleRefreshRoles">
                <template #icon>
                  <ReloadOutlined />
                </template>
                刷新
              </a-button>
            </template>

            <a-table
              :columns="roleColumns"
              :data-source="roleMappings"
              :loading="loading"
              :pagination="false"
              row-key="role"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'role'">
                  <a-tag :color="getRoleColor(record.role)">
                    {{ getRoleText(record.role) }}
                  </a-tag>
                </template>

                <template v-else-if="column.key === 'permissions'">
                  <div class="permissions-cell">
                    <a-tag
                      v-for="permission in record.permissions.slice(0, 3)"
                      :key="permission"
                      size="small"
                      class="permission-tag-small"
                    >
                      {{ permission }}
                    </a-tag>
                    <a-tag
                      v-if="record.permissions.length > 3"
                      size="small"
                      class="permission-tag-small"
                    >
                      +{{ record.permissions.length - 3 }}
                    </a-tag>
                  </div>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 权限配置 -->
    <div class="permissions-config">
      <a-card title="权限配置" class="permissions-card">
        <template #extra>
          <a-space>
            <a-button @click="handleRefreshConfig">
              <template #icon>
                <ReloadOutlined />
              </template>
              刷新
            </a-button>
            <a-button
              type="primary"
              @click="handleSaveConfig"
              :loading="saving"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              保存配置
            </a-button>
          </a-space>
        </template>

        <a-form
          :model="configForm"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
        >
          <a-form-item label="启用权限检查">
            <a-switch v-model:checked="configForm.enabled" />
          </a-form-item>

          <a-form-item label="启用细粒度权限">
            <a-switch v-model:checked="configForm.enableFineGrained" />
          </a-form-item>

          <a-form-item label="默认权限策略">
            <a-radio-group v-model:value="configForm.defaultPolicy">
              <a-radio value="allow">允许</a-radio>
              <a-radio value="deny">拒绝</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item label="权限缓存时间">
            <a-input-number
              v-model:value="configForm.cacheTimeout"
              :min="60"
              :max="3600"
              addon-after="秒"
            />
          </a-form-item>
        </a-form>
      </a-card>
    </div>

    <!-- 权限测试 -->
    <div class="permissions-test">
      <a-card title="权限测试" class="permissions-card">
        <template #extra>
          <a-button @click="handleTestPermission">
            <template #icon>
              <CheckCircleOutlined />
            </template>
            测试权限
          </a-button>
        </template>

        <a-form
          :model="testForm"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
        >
          <a-form-item label="权限标识">
            <a-select
              v-model:value="testForm.permission"
              placeholder="选择权限"
              allow-clear
            >
              <a-select-option value="read:gitlab_instance"
                >读取实例</a-select-option
              >
              <a-select-option value="create:gitlab_instance"
                >创建实例</a-select-option
              >
              <a-select-option value="update:gitlab_instance"
                >更新实例</a-select-option
              >
              <a-select-option value="delete:gitlab_instance"
                >删除实例</a-select-option
              >
              <a-select-option value="read:gitlab_project_mapping"
                >读取映射</a-select-option
              >
              <a-select-option value="create:gitlab_project_mapping"
                >创建映射</a-select-option
              >
              <a-select-option value="sync:gitlab_sync"
                >执行同步</a-select-option
              >
            </a-select>
          </a-form-item>

          <a-form-item label="实例ID">
            <a-input v-model:value="testForm.instanceId" placeholder="可选" />
          </a-form-item>

          <a-form-item label="项目ID">
            <a-input v-model:value="testForm.projectId" placeholder="可选" />
          </a-form-item>

          <a-form-item label="测试结果" v-if="testResult">
            <a-alert
              :message="
                testResult.hasPermission ? '权限验证通过' : '权限验证失败'
              "
              :type="testResult.hasPermission ? 'success' : 'error'"
              :description="testResult.message"
              show-icon
            />
          </a-form-item>
        </a-form>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  UserOutlined,
  DatabaseOutlined,
  LinkOutlined,
  SyncOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue';
import { GitLabApiService } from '@/api/gitlab';

// Props
interface Props {
  permissions: any;
  roleMappings: any[];
  loading: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  refresh: () => void;
  'update-config': (config: any) => void;
}>();

// 响应式数据
const saving = ref(false);
const testResult = ref(null);

// 配置表单
const configForm = reactive({
  enabled: true,
  enableFineGrained: false,
  defaultPolicy: 'deny',
  cacheTimeout: 300,
});

// 测试表单
const testForm = reactive({
  permission: '',
  instanceId: '',
  projectId: '',
});

// 表格列配置
const roleColumns = [
  {
    title: '角色',
    key: 'role',
    width: 120,
  },
  {
    title: '权限',
    key: 'permissions',
    width: 300,
  },
  {
    title: '可继承',
    key: 'inheritable',
    width: 100,
  },
];

// 方法
const handleRefresh = () => {
  emit('refresh');
};

const handleRefreshRoles = async () => {
  try {
    const response = await GitLabApiService.getRolePermissionMappings();
    // 这里应该更新roleMappings数据
    message.success('刷新角色权限映射成功');
  } catch (error) {
    message.error('刷新角色权限映射失败');
  }
};

const handleRefreshConfig = async () => {
  try {
    const response = await GitLabApiService.getPermissionConfig();
    Object.assign(configForm, response.data);
    message.success('刷新权限配置成功');
  } catch (error) {
    message.error('刷新权限配置失败');
  }
};

const handleSaveConfig = async () => {
  saving.value = true;
  try {
    await GitLabApiService.updatePermissionConfig(configForm);
    message.success('保存权限配置成功');
    emit('update-config', configForm);
  } catch (error) {
    message.error('保存权限配置失败');
  } finally {
    saving.value = false;
  }
};

const handleTestPermission = async () => {
  if (!testForm.permission) {
    message.warning('请选择要测试的权限');
    return;
  }

  try {
    const response = await GitLabApiService.checkPermission(
      testForm.permission,
      {
        instanceId: testForm.instanceId || undefined,
        projectId: testForm.projectId || undefined,
      }
    );
    testResult.value = response.data;
  } catch (error) {
    message.error('权限测试失败');
  }
};

const getRoleColor = (role: string) => {
  const colors = {
    system_admin: 'red',
    project_manager: 'blue',
    user: 'green',
  };
  return colors[role] || 'default';
};

const getRoleText = (role: string) => {
  const texts = {
    system_admin: '系统管理员',
    project_manager: '项目管理员',
    user: '普通用户',
  };
  return texts[role] || role;
};

// 生命周期
onMounted(() => {
  handleRefreshConfig();
});
</script>

<style scoped>
.gitlab-permissions-tab {
  padding: 0;
}

.permissions-overview {
  margin-bottom: 24px;
}

.permissions-details {
  margin-bottom: 24px;
}

.permissions-card {
  margin-bottom: 24px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  margin-bottom: 8px;
}

.permissions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.permission-tag-small {
  margin-bottom: 4px;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
</style>
