<template>
  <!-- 项目信息单元格 -->
  <template v-if="column.key === 'project'">
    <div class="project-info">
      <a-avatar :size="24" :src="record.project?.avatar">
        <template #icon>
          <ProjectOutlined />
        </template>
      </a-avatar>
      <div class="project-details">
        <div class="project-name">{{ record.project?.name || '未知项目' }}</div>
        <div class="project-key">{{ record.project?.key || '' }}</div>
        <div class="project-visibility">
          <a-tag :color="record.project?.visibility === 'public' ? 'blue' : 'default'" size="small">
            {{ record.project?.visibility === 'public' ? '公开' : '私有' }}
          </a-tag>
          <a-tag v-if="record.project?.archived" color="orange" size="small">已归档</a-tag>
        </div>
      </div>
    </div>
  </template>

  <!-- GitLab分组单元格 -->
  <template v-else-if="column.key === 'gitlabGroup'">
    <div class="gitlab-group">
      <div class="group-path">{{ record.gitlabGroupPath }}</div>
      <div class="group-id">ID: {{ record.gitlabGroupId }}</div>
      <div v-if="record.groupName" class="group-name">{{ record.groupName }}</div>
    </div>
  </template>

  <!-- 实例信息单元格 -->
  <template v-else-if="column.key === 'instance'">
    <div class="instance-info">
      <a-avatar :size="20" :src="record.gitlabInstance?.avatar">
        <template #icon>
          <DatabaseOutlined />
        </template>
      </a-avatar>
      <span class="instance-name">{{ record.gitlabInstance?.name || '未知实例' }}</span>
    </div>
  </template>

  <!-- 状态单元格 -->
  <template v-else-if="column.key === 'status'">
    <a-tag :color="record.isActive ? 'success' : 'default'">
      {{ record.isActive ? '活跃' : '非活跃' }}
    </a-tag>
  </template>

  <!-- 最后同步时间单元格 -->
  <template v-else-if="column.key === 'lastSyncAt'">
    <span v-if="record.lastSyncAt">
      {{ formatDate(record.lastSyncAt) }}
    </span>
    <span v-else class="text-muted">从未同步</span>
  </template>

  <!-- 更新时间单元格 -->
  <template v-else-if="column.key === 'updatedAt'">
    <span>{{ formatDate(record.updatedAt) }}</span>
  </template>
</template>

<script setup lang="ts">
import { ProjectOutlined, DatabaseOutlined } from '@ant-design/icons-vue';
import type { CellProps } from './types/mappings.types';

// Props
const props = defineProps<CellProps>();

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};
</script>

<style scoped>
.project-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-details {
  flex: 1;
}

.project-name {
  font-weight: 500;
  color: #262626;
}

.project-key {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
  font-family: monospace;
}

.project-visibility {
  margin-top: 4px;
  display: flex;
  gap: 4px;
}

.gitlab-group {
  display: flex;
  flex-direction: column;
}

.group-path {
  font-weight: 500;
  color: #262626;
}

.group-id {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.group-name {
  font-size: 12px;
  color: #1890ff;
  margin-top: 2px;
  font-style: italic;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.instance-name {
  font-size: 14px;
  color: #262626;
}

.text-muted {
  color: #8c8c8c;
}

:deep(.ant-avatar) {
  background-color: #1890ff;
}
</style>

