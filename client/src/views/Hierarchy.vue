<template>
  <a-card title="层级结构管理" :bordered="false">
    <a-space style="margin-bottom: 12px">
      <a-select
        v-model:value="entityTypeFilter"
        placeholder="实体类型"
        allow-clear
        style="width: 140px"
        @change="loadHierarchy"
      >
        <a-select-option value="requirement">需求</a-select-option>
        <a-select-option value="subsystem">子系统</a-select-option>
        <a-select-option value="feature_module">功能模块</a-select-option>
        <a-select-option value="task">任务</a-select-option>
        <a-select-option value="bug">缺陷</a-select-option>
      </a-select>
      <a-button type="primary" @click="loadHierarchy">刷新</a-button>
      <a-button type="primary" @click="showCreateRelationModal">建立关系</a-button>
    </a-space>

    <!-- 层级结构树 -->
    <a-tree
      v-if="hierarchyData.length > 0"
      :tree-data="hierarchyData"
      :field-names="{ children: 'children', title: 'title', key: 'id' }"
      :show-line="true"
      :show-icon="true"
      :default-expand-all="true"
      @select="onNodeSelect"
    >
      <template #title="{ title, entityType, state }">
        <div class="tree-node">
          <a-tag :color="getEntityTypeColor(entityType)" size="small">
            {{ getEntityTypeLabel(entityType) }}
          </a-tag>
          <span class="node-title">{{ title }}</span>
          <a-tag v-if="state" :color="getStateColor(state)" size="small">
            {{ getStateLabel(state) }}
          </a-tag>
        </div>
      </template>
    </a-tree>

    <a-empty v-else description="暂无层级结构数据" />

    <!-- 建立关系模态框 -->
    <a-modal
      v-model:open="relationModalVisible"
      title="建立层级关系"
      width="600px"
      @ok="handleRelationSubmit"
      @cancel="handleRelationCancel"
    >
      <a-form
        ref="relationFormRef"
        :model="relationForm"
        :rules="relationFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="父级实体" name="parentId">
          <a-select
            v-model:value="relationForm.parentId"
            placeholder="请选择父级实体"
            :loading="parentEntitiesLoading"
            @focus="loadParentEntities"
          >
            <a-select-option
              v-for="entity in parentEntities"
              :key="entity.id"
              :value="entity.id"
            >
              [{{ getEntityTypeLabel(entity.entityType) }}] {{ entity.title }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="子级实体" name="childId">
          <a-select
            v-model:value="relationForm.childId"
            placeholder="请选择子级实体"
            :loading="childEntitiesLoading"
            @focus="loadChildEntities"
          >
            <a-select-option
              v-for="entity in childEntities"
              :key="entity.id"
              :value="entity.id"
            >
              [{{ getEntityTypeLabel(entity.entityType) }}] {{ entity.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 实体详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="实体详情"
      width="800px"
      :footer="null"
    >
      <div v-if="selectedEntity" class="entity-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="标题">
            {{ selectedEntity.title }}
          </a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag :color="getEntityTypeColor(selectedEntity.entityType)">
              {{ getEntityTypeLabel(selectedEntity.entityType) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStateColor(selectedEntity.state)">
              {{ getStateLabel(selectedEntity.state) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="getPriorityColor(selectedEntity.priority)">
              {{ getPriorityLabel(selectedEntity.priority) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDate(selectedEntity.createdAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDate(selectedEntity.updatedAt) }}
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">
            <div v-if="selectedEntity.description" v-html="formatDescription(selectedEntity.description)"></div>
            <span v-else class="text-gray-400">暂无描述</span>
          </a-descriptions-item>
        </a-descriptions>

        <div v-if="selectedEntity.children && selectedEntity.children.length > 0" class="children-section">
          <h4>子级实体</h4>
          <a-list
            :data-source="selectedEntity.children"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-tag :color="getEntityTypeColor(item.entityType)" size="small">
                  {{ getEntityTypeLabel(item.entityType) }}
                </a-tag>
                <span class="child-title">{{ item.title }}</span>
                <a-tag v-if="item.state" :color="getStateColor(item.state)" size="small">
                  {{ getStateLabel(item.state) }}
                </a-tag>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import http from '../api/http';
import { useLoading } from '../composables/useLoading';

interface HierarchyEntity {
  id: string;
  title: string;
  entityType: 'requirement' | 'subsystem' | 'feature_module' | 'task' | 'bug';
  state?: string;
  priority?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  children?: HierarchyEntity[];
}

interface EntityOption {
  id: string;
  title: string;
  entityType: string;
}

interface RelationForm {
  parentId: string;
  childId: string;
}

const props = defineProps<{
  projectId: string;
}>();

const { loading, withLoading } = useLoading();

// 数据状态
const hierarchyData = ref<HierarchyEntity[]>([]);
const entityTypeFilter = ref('');

// 模态框状态
const relationModalVisible = ref(false);
const detailModalVisible = ref(false);
const selectedEntity = ref<HierarchyEntity | null>(null);

// 关系表单
const relationForm = ref<RelationForm>({
  parentId: '',
  childId: '',
});

const relationFormRef = ref();

// 实体选项
const parentEntities = ref<EntityOption[]>([]);
const childEntities = ref<EntityOption[]>([]);
const parentEntitiesLoading = ref(false);
const childEntitiesLoading = ref(false);

// 表单验证规则
const relationFormRules = {
  parentId: [{ required: true, message: '请选择父级实体', trigger: 'change' }],
  childId: [{ required: true, message: '请选择子级实体', trigger: 'change' }],
};

// 实体类型颜色映射
const getEntityTypeColor = (entityType: string) => {
  const colors = {
    requirement: 'blue',
    subsystem: 'green',
    feature_module: 'orange',
    task: 'purple',
    bug: 'red',
  };
  return colors[entityType as keyof typeof colors] || 'default';
};

// 实体类型标签映射
const getEntityTypeLabel = (entityType: string) => {
  const labels = {
    requirement: '需求',
    subsystem: '子系统',
    feature_module: '功能模块',
    task: '任务',
    bug: '缺陷',
  };
  return labels[entityType as keyof typeof labels] || entityType;
};

// 状态颜色映射
const getStateColor = (state?: string) => {
  if (!state) return 'default';
  const colors = {
    open: 'blue',
    in_progress: 'orange',
    closed: 'green',
  };
  return colors[state as keyof typeof colors] || 'default';
};

// 状态标签映射
const getStateLabel = (state?: string) => {
  if (!state) return '未设置';
  const labels = {
    open: '开放',
    in_progress: '进行中',
    closed: '已关闭',
  };
  return labels[state as keyof typeof labels] || state;
};

// 优先级颜色映射
const getPriorityColor = (priority?: string) => {
  if (!priority) return 'default';
  const colors = {
    low: 'green',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  return colors[priority as keyof typeof colors] || 'default';
};

// 优先级标签映射
const getPriorityLabel = (priority?: string) => {
  if (!priority) return '未设置';
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority as keyof typeof labels] || priority;
};

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

// 格式化描述
const formatDescription = (description: string) => {
  return description.replace(/\n/g, '<br>');
};

// 加载层级结构
const loadHierarchy = withLoading(async () => {
  try {
    const params = {
      entityType: entityTypeFilter.value,
    };

    const response = await http.get('/hierarchy/tree', { params });
    hierarchyData.value = response.data || [];
  } catch (error) {
    message.error('加载层级结构失败');
    console.error('Load hierarchy error:', error);
  }
});

// 节点选择处理
const onNodeSelect = (selectedKeys: string[], info: any) => {
  if (info.selected && info.node) {
    selectedEntity.value = info.node;
    detailModalVisible.value = true;
  }
};

// 显示建立关系模态框
const showCreateRelationModal = () => {
  relationForm.value = {
    parentId: '',
    childId: '',
  };
  relationModalVisible.value = true;
};

// 加载父级实体选项
const loadParentEntities = withLoading(async () => {
  parentEntitiesLoading.value = true;
  try {
    const response = await http.get('/hierarchy/parent-options', {
      params: { projectId: props.projectId }
    });
    parentEntities.value = response.data || [];
  } catch (error) {
    message.error('加载父级实体失败');
    console.error('Load parent entities error:', error);
  } finally {
    parentEntitiesLoading.value = false;
  }
});

// 加载子级实体选项
const loadChildEntities = withLoading(async () => {
  childEntitiesLoading.value = true;
  try {
    const response = await http.get('/hierarchy/child-options', {
      params: { 
        projectId: props.projectId,
        parentId: relationForm.value.parentId
      }
    });
    childEntities.value = response.data || [];
  } catch (error) {
    message.error('加载子级实体失败');
    console.error('Load child entities error:', error);
  } finally {
    childEntitiesLoading.value = false;
  }
});

// 提交关系表单
const handleRelationSubmit = async () => {
  try {
    await relationFormRef.value.validate();
    
    await http.post('/hierarchy/relations', {
      parentId: relationForm.value.parentId,
      childId: relationForm.value.childId,
    });

    message.success('关系建立成功');
    relationModalVisible.value = false;
    loadHierarchy();
  } catch (error) {
    message.error('建立关系失败');
    console.error('Create relation error:', error);
  }
};

// 取消关系表单
const handleRelationCancel = () => {
  relationModalVisible.value = false;
  relationFormRef.value?.resetFields();
};

// 初始化
onMounted(() => {
  loadHierarchy();
});
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-title {
  flex: 1;
  font-weight: 500;
}

.child-title {
  margin-left: 8px;
  font-weight: 500;
}

.entity-detail {
  max-height: 600px;
  overflow-y: auto;
}

.children-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.children-section h4 {
  margin-bottom: 12px;
  color: #1890ff;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
