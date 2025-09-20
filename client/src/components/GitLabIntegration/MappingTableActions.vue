<template>
  <a-space>
    <a-tooltip title="同步映射">
      <a-button
        type="text"
        size="small"
        @click="$emit('sync', record)"
        :loading="syncingMappings.includes(record.id)"
      >
        <template #icon>
          <SyncOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip title="编辑">
      <a-button
        type="text"
        size="small"
        @click="$emit('edit', record)"
      >
        <template #icon>
          <EditOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <a-tooltip title="删除">
      <a-popconfirm
        title="确定要删除这个映射吗？"
        @confirm="$emit('delete', record)"
      >
        <a-button
          type="text"
          size="small"
          danger
        >
          <template #icon>
            <DeleteOutlined />
          </template>
        </a-button>
      </a-popconfirm>
    </a-tooltip>
  </a-space>
</template>

<script setup lang="ts">
import {
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import type { ActionsProps } from './types/mappings.types';

// Props
const props = defineProps<ActionsProps>();

// Emits
const emit = defineEmits<{
  edit: [record: any];
  delete: [record: any];
  sync: [record: any];
}>();
</script>

