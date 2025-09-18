<template>
  <a-modal
    :open="open"
    title="功能模块详情"
    width="800px"
    :footer="null"
  >
    <div v-if="record" class="feature-module-detail">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="名称">{{ record.title }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStateColor(record.state)">{{ getStateLabel(record.state) }}</a-tag>
        </a-descriptions-item>
        
        <a-descriptions-item label="负责人">
          <a-avatar :size="24" :src="record.assignee?.avatar">
            {{ record.assignee?.name?.charAt(0)?.toUpperCase() }}
          </a-avatar>
          <span style="margin-left: 8px">{{ record.assignee?.name || '未分配' }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(record.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDate(record.updatedAt) }}</a-descriptions-item>
        <a-descriptions-item label="标签" :span="2">
          <a-tag v-for="label in record.labels" :key="label" color="blue">{{ label }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">
          <div v-if="record.description" v-html="formatDescription(record.description)"></div>
          <span v-else class="text-gray-400">暂无描述</span>
        </a-descriptions-item>
      </a-descriptions>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
export interface FeatureModuleDetail {
  id: string;
  title: string;
  state: string;
  assignee?: { id: string; name: string; avatar?: string };
  labels: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const _props = defineProps<{
  open: boolean;
  record: FeatureModuleDetail | null;
}>()

const getStateColor = (state: string) => ({ open: 'blue', in_progress: 'orange', closed: 'green' } as any)[state] || 'default'
const getStateLabel = (state: string) => ({ open: '开放', in_progress: '进行中', closed: '已关闭' } as any)[state] || state
const formatDate = (date: string) => new Date(date).toLocaleString('zh-CN')
const formatDescription = (description: string) => description.replace(/\n/g, '<br>')
</script>

<style scoped>
.feature-module-detail { max-height: 600px; overflow-y: auto; }
.text-gray-400 { color: #9ca3af; }
</style>


