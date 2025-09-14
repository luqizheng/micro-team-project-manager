<template>
  <div class="gitlab-integration">
    <a-page-header
      title="GitLab集成管理"
      sub-title="管理GitLab实例、项目映射和同步配置"
      :breadcrumb="{ routes: breadcrumbRoutes }"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showCreateInstanceModal">
            <template #icon>
              <PlusOutlined />
            </template>
            添加GitLab实例
          </a-button>
          <a-button @click="refreshData">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <div class="content">
      <!-- 统计卡片 -->
      <a-row :gutter="16" class="stats-cards">
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="GitLab实例"
              :value="statistics.instances"
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
              title="项目映射"
              :value="statistics.mappings"
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
              title="同步任务"
              :value="statistics.syncTasks"
              :loading="loading"
            >
              <template #prefix>
                <SyncOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card>
            <a-statistic
              title="事件处理"
              :value="statistics.events"
              :loading="loading"
            >
              <template #prefix>
                <NotificationOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <!-- 标签页 -->
      <a-tabs v-model:activeKey="activeTab" class="main-tabs">
        <a-tab-pane key="instances" tab="GitLab实例">
          <GitLabInstancesTab
            :instances="instances"
            :loading="loading"
            @refresh="refreshInstances"
            @create="showCreateInstanceModal"
            @edit="showEditInstanceModal"
            @delete="handleDeleteInstance"
            @test="handleTestInstance"
          />
        </a-tab-pane>

        <a-tab-pane key="mappings" tab="项目映射">
          <GitLabMappingsTab
            :mappings="mappings"
            :projects="projects"
            :instances="instances"
            :loading="loading"
            @refresh="refreshMappings"
            @create="showCreateMappingModal"
            @edit="showEditMappingModal"
            @delete="handleDeleteMapping"
            @sync="handleSyncMapping"
          />
        </a-tab-pane>

        <a-tab-pane key="sync" tab="同步管理">
          <GitLabSyncTab
            :instances="instances"
            :sync-status="syncStatus"
            :loading="loading"
            @refresh="refreshSyncStatus"
            @incremental-sync="handleIncrementalSync"
            @full-sync="handleFullSync"
            @compensation-sync="handleCompensationSync"
            @user-sync="handleUserSync"
          />
        </a-tab-pane>

        <a-tab-pane key="events" tab="事件管理">
          <GitLabEventsTab
            :events="events"
            :statistics="eventStatistics"
            :loading="loading"
            @refresh="refreshEvents"
            @retry="handleRetryEvent"
            @batch-retry="handleBatchRetryEvents"
          />
        </a-tab-pane>

        <a-tab-pane key="permissions" tab="权限管理">
          <GitLabPermissionsTab
            :permissions="permissions"
            :role-mappings="roleMappings"
            :loading="loading"
            @refresh="refreshPermissions"
            @update-config="handleUpdatePermissionConfig"
          />
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 创建实例模态框 -->
    <GitLabInstanceModal
      v-model:visible="createInstanceVisible"
      :instance="editingInstance"
      @success="handleInstanceSuccess"
    />

    <!-- 创建映射模态框 -->
    <GitLabMappingModal
      v-model:visible="createMappingVisible"
      :mapping="editingMapping"
      :projects="projects"
      :instances="instances"
      @success="handleMappingSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  LinkOutlined,
  SyncOutlined,
  NotificationOutlined,
} from '@ant-design/icons-vue';
import { GitLabApiService } from '@/api/gitlab';
import http from '@/api/http';
import GitLabInstancesTab from '@/components/GitLabIntegration/GitLabInstancesTab.vue';
import GitLabMappingsTab from '@/components/GitLabIntegration/GitLabMappingsTab.vue';
import GitLabSyncTab from '@/components/GitLabIntegration/GitLabSyncTab.vue';
import GitLabEventsTab from '@/components/GitLabIntegration/GitLabEventsTab.vue';
import GitLabPermissionsTab from '@/components/GitLabIntegration/GitLabPermissionsTab.vue';
import GitLabInstanceModal from '@/components/GitLabIntegration/GitLabInstanceModal.vue';
import GitLabMappingModal from '@/components/GitLabIntegration/GitLabMappingModal.vue';

// 响应式数据
const loading = ref(false);
const activeTab = ref('instances');

// 统计数据
const statistics = reactive({
  instances: 0,
  mappings: 0,
  syncTasks: 0,
  events: 0,
});

// 数据列表
const instances = ref([]);
const mappings = ref([]);
const projects = ref([]);
const events = ref([]);
const permissions = ref({});
const roleMappings = ref([]);
const syncStatus = ref({});
const eventStatistics = ref({});

// 模态框状态
const createInstanceVisible = ref(false);
const createMappingVisible = ref(false);
const editingInstance = ref(null);
const editingMapping = ref(null);

// 面包屑导航
const breadcrumbRoutes = [
  { path: '/', breadcrumbName: '首页' },
  { path: '/gitlab', breadcrumbName: 'GitLab集成' },
];

// 计算属性
const hasPermission = computed(() => {
  // 这里应该根据用户权限来判断
  return true;
});

// 方法
const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      refreshStatistics(),
      refreshInstances(),
      refreshProjects(),
      refreshMappings(),
      refreshEvents(),
      refreshPermissions(),
      refreshSyncStatus(),
    ]);
  } catch (error) {
    message.error('刷新数据失败');
  } finally {
    loading.value = false;
  }
};

const refreshStatistics = async () => {
  try {
    const response = await GitLabApiService.getStatistics();
    Object.assign(statistics, response.data.data);
  } catch (error) {
    console.error('获取统计信息失败:', error);
  }
};

const refreshInstances = async () => {
  try {
    const response = await GitLabApiService.getInstances();
    instances.value = response.data.data;
  } catch (error) {
    message.error('获取GitLab实例失败');
  }
};

const refreshProjects = async () => {
  try {
    const response = await http.get('/projects');
    projects.value = response.data.data.items;
  } catch (error) {
    message.error('获取项目列表失败');
  }
};

const refreshMappings = async () => {
  try {
    // 获取所有项目映射
    const response = await GitLabApiService.getAllProjectMappings();
    mappings.value = response.data.data || [];
  } catch (error) {
    message.error('获取项目映射失败');
  }
};

const refreshEvents = async () => {
  try {
    const response = await GitLabApiService.getEventStatistics();
    eventStatistics.value = response.data.data;
  } catch (error) {
    message.error('获取事件统计失败');
  }
};

const refreshPermissions = async () => {
  try {
    const response = await GitLabApiService.getMyPermissionSummary();
    permissions.value = response.data.data;
  } catch (error) {
    message.error('获取权限信息失败');
  }
};

const refreshSyncStatus = async () => {
  try {
    const response = await GitLabApiService.getEventHealthStatus();
    syncStatus.value = response.data.data;
  } catch (error) {
    message.error('获取同步状态失败');
  }
};

// 实例管理
const showCreateInstanceModal = () => {
  editingInstance.value = null;
  createInstanceVisible.value = true;
};

const showEditInstanceModal = (instance: any) => {
  editingInstance.value = instance;
  createInstanceVisible.value = true;
};

const handleDeleteInstance = async (instance: any) => {
  try {
    await GitLabApiService.deleteInstance(instance.id);
    message.success('删除实例成功');
    await refreshInstances();
  } catch (error) {
    message.error('删除实例失败');
  }
};

const handleTestInstance = async (instance: any) => {
  try {
    await GitLabApiService.testInstance(instance.id);
    message.success('测试连接成功');
  } catch (error) {
    message.error('测试连接失败');
  }
};

const handleInstanceSuccess = () => {
  createInstanceVisible.value = false;
  refreshInstances();
};

// 映射管理
const showCreateMappingModal = () => {
  editingMapping.value = null;
  createMappingVisible.value = true;
};

const showEditMappingModal = (mapping: any) => {
  editingMapping.value = mapping;
  createMappingVisible.value = true;
};

const handleDeleteMapping = async (mapping: any) => {
  try {
    await GitLabApiService.deleteProjectMapping(mapping.projectId, mapping.id);
    message.success('删除映射成功');
    await refreshMappings();
  } catch (error) {
    message.error('删除映射失败');
  }
};

const handleSyncMapping = async (mapping: any) => {
  try {
    await GitLabApiService.syncProjectMapping(mapping.projectId, mapping.id);
    message.success('同步映射成功');
  } catch (error) {
    message.error('同步映射失败');
  }
};

const handleMappingSuccess = () => {
  createMappingVisible.value = false;
  refreshMappings();
};

// 同步管理
const handleIncrementalSync = async (instanceId: string, projectId?: string) => {
  try {
    await GitLabApiService.performIncrementalSync(instanceId, projectId);
    message.success('增量同步已启动');
    await refreshSyncStatus();
  } catch (error) {
    message.error('启动增量同步失败');
  }
};

const handleFullSync = async (instanceId: string, projectId?: string) => {
  try {
    await GitLabApiService.performFullSync(instanceId, projectId);
    message.success('全量同步已启动');
    await refreshSyncStatus();
  } catch (error) {
    message.error('启动全量同步失败');
  }
};

const handleCompensationSync = async (instanceId: string, projectId?: string) => {
  try {
    await GitLabApiService.performCompensationSync(instanceId, projectId);
    message.success('补偿同步已启动');
    await refreshSyncStatus();
  } catch (error) {
    message.error('启动补偿同步失败');
  }
};

const handleUserSync = async (instanceId: string) => {
  try {
    await GitLabApiService.syncUsers(instanceId);
    message.success('用户同步已启动');
    await refreshSyncStatus();
  } catch (error) {
    message.error('启动用户同步失败');
  }
};

// 事件管理
const handleRetryEvent = async (eventId: string) => {
  try {
    await GitLabApiService.retryEvent(eventId);
    message.success('重试事件成功');
    await refreshEvents();
  } catch (error) {
    message.error('重试事件失败');
  }
};

const handleBatchRetryEvents = async (eventIds: string[]) => {
  try {
    await GitLabApiService.batchRetryEvents(eventIds);
    message.success('批量重试事件成功');
    await refreshEvents();
  } catch (error) {
    message.error('批量重试事件失败');
  }
};

// 权限管理
const handleUpdatePermissionConfig = async (config: any) => {
  try {
    await GitLabApiService.updatePermissionConfig(config);
    message.success('更新权限配置成功');
    await refreshPermissions();
  } catch (error) {
    message.error('更新权限配置失败');
  }
};

// 生命周期
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.gitlab-integration {
  padding: 24px;
}

.content {
  margin-top: 24px;
}

.stats-cards {
  margin-bottom: 24px;
}

.main-tabs {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.ant-tabs-content-holder) {
  padding-top: 16px;
}
</style>
