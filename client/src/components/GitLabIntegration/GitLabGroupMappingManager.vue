<template>
  <a-card title="GitLab分组映射" class="group-mapping-card">
    <template #extra>
      <a-button 
        type="primary" 
        @click="showAddModal = true" 
        :disabled="!canManage"
      >
        添加分组映射
      </a-button>
    </template>

    <a-table
      :columns="columns"
      :data-source="mappings"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="onTableChange"
    >
      <template #groupInfo="{ record }">
        <div class="group-info">
          <div class="group-name">{{ record.groupName }}</div>
          <div class="group-path">{{ record.groupFullPath }}</div>
        </div>
      </template>

      <template #instanceInfo="{ record }">
        <div class="instance-info">
          <div class="instance-name">{{ record.instanceName || 'Unknown Instance' }}</div>
          <div class="instance-url">{{ record.instanceUrl || '' }}</div>
        </div>
      </template>

      <template #status="{ record }">
        <a-tag :color="record.isActive ? 'green' : 'red'">
          {{ record.isActive ? '激活' : '禁用' }}
        </a-tag>
      </template>

      <template #action="{ record }">
        <a-space>
          <a-button size="small" @click="editMapping(record)">编辑</a-button>
          <a-button size="small" danger @click="deleteMapping(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 添加/编辑分组映射模态框 -->
    <GroupMappingModal
      v-model:open="showAddModal"
      :project-id="projectId"
      :mapping="editingMapping"
      @success="loadMappings"
    />
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import http from '../../api/http';
import GroupMappingModal from './GroupMappingModal.vue';

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
  instanceName?: string;
  instanceUrl?: string;
}

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const mappings = ref<GroupMapping[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const editingMapping = ref<GroupMapping | null>(null);

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

const columns = [
  {
    title: '分组信息',
    dataIndex: 'groupInfo',
    key: 'groupInfo',
    slots: { customRender: 'groupInfo' },
  },
  {
    title: 'GitLab实例',
    dataIndex: 'instanceInfo',
    key: 'instanceInfo',
    slots: { customRender: 'instanceInfo' },
  },
  {
    title: '分组路径',
    dataIndex: 'groupFullPath',
    key: 'groupFullPath',
  },
  {
    title: '可见性',
    dataIndex: 'groupVisibility',
    key: 'groupVisibility',
    customRender: ({ text }: { text: string }) => {
      const colorMap: Record<string, string> = {
        private: 'red',
        internal: 'orange',
        public: 'green',
      };
      const textMap: Record<string, string> = {
        private: '私有',
        internal: '内部',
        public: '公开',
      };
      return h('a-tag', { color: colorMap[text] || 'default' }, textMap[text] || text);
    },
  },
  {
    title: '项目数量',
    dataIndex: 'groupProjectsCount',
    key: 'groupProjectsCount',
  },
  {
    title: '状态',
    dataIndex: 'isActive',
    key: 'isActive',
    slots: { customRender: 'status' },
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    customRender: ({ text }: { text: string }) => new Date(text).toLocaleString(),
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

const canManage = computed(() => {
  // 这里应该根据用户权限来判断
  // 暂时返回true，实际应该从store中获取用户权限
  return true;
});

const loadMappings = async () => {
  loading.value = true;
  try {
    const response = await http.get(`/projects/${props.projectId}/gitlab-groups`);
    mappings.value = response.data;
  } catch (error: any) {
    message.error('加载分组映射失败');
    console.error('Load mappings error:', error);
  } finally {
    loading.value = false;
  }
};

const onTableChange = (pag: any) => {
  pagination.value = {
    ...pagination.value,
    current: pag.current,
    pageSize: pag.pageSize,
  };
  loadMappings();
};

const editMapping = (mapping: GroupMapping) => {
  editingMapping.value = mapping;
  showAddModal.value = true;
};

const deleteMapping = (mapping: GroupMapping) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分组映射 "${mapping.groupName}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await http.delete(`/projects/${props.projectId}/gitlab-groups/${mapping.id}`);
        message.success('删除成功');
        await loadMappings();
      } catch (error: any) {
        message.error('删除失败');
        console.error('Delete mapping error:', error);
      }
    },
  });
};

onMounted(() => {
  loadMappings();
});
</script>

<style scoped>
.group-mapping-card {
  margin-top: 16px;
}

.group-info {
  display: flex;
  flex-direction: column;
}

.group-name {
  font-weight: 500;
  color: #1890ff;
}

.group-path {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.instance-info {
  display: flex;
  flex-direction: column;
}

.instance-name {
  font-weight: 500;
  color: #52c41a;
}

.instance-url {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
</style>
