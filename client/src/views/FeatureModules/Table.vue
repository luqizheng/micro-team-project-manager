<template>
  <a-table
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    row-key="id"
    :defaultExpandAllRows="true"
    :pagination="false"
  >
    <template #title="{ record }">
      <a-button type="link" @click="emit('view', record)">
        {{ record?.title }}
      </a-button>
    </template>

    <template #state="{ record }">
      <a-tag :color="getStateColor(record.state)">
        {{ getStateLabel(record.state) }}
      </a-tag>
    </template>


    <template #assignee="{ record }">
      <a-avatar :size="24" :src="record.assignee?.avatar">
        {{ record.assignee?.name?.charAt(0)?.toUpperCase() }}
      </a-avatar>
      <span style="margin-left: 8px">{{
        record.assignee?.name || "未分配"
      }}</span>
    </template>

    <template #createdAt="{ record }">
      {{ formatDate(record.createdAt) }}
    </template>

    <template #updatedAt="{ record }">
      {{ formatDate(record.updatedAt) }}
    </template>

    <template #action="{ record }">
      <a-space>
        <a-button type="link" size="small" @click="emit('edit', record)"
          >编辑</a-button
        >
        <a-button type="link" size="small" @click="emit('view', record)"
          >详情</a-button
        >
        <a-popconfirm
          title="确定要删除这个功能模块吗？"
          @confirm="emit('delete', record.id)"
        >
          <a-button type="link" size="small" danger>删除</a-button>
        </a-popconfirm>
      </a-space>
    </template>
  </a-table>
</template>

<script setup lang="ts">
// 移除未使用的 computed 导入

export interface FeatureModuleRow {
  id: string;
  title: string;
  state: string;
  assignee?: { id: string; name: string; avatar?: string };
  labels: string[];
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  children?: FeatureModuleRow[];
}

const props = defineProps<{
  dataSource: FeatureModuleRow[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "view", record: FeatureModuleRow): void;
  (e: "edit", record: FeatureModuleRow): void;
  (e: "delete", id: string): void;
}>();

const columns = [
  {
    title: "名称",
    dataIndex: "title",
    key: "title",
    slots: { customRender: "title" },
    width: 300,
  },
  {
    title: "状态",
    dataIndex: "state",
    key: "state",
    slots: { customRender: "state" },
    width: 100,
  },
  {
    title: "负责人",
    dataIndex: "assignee",
    key: "assignee",
    slots: { customRender: "assignee" },
    width: 150,
  },
 
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    slots: { customRender: "updatedAt" },
    width: 120,
  },
  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
    width: 200,
    fixed: "right",
  },
];

const getStateColor = (state: string) => {
  const colors: Record<string, string> = {
    open: "blue",
    in_progress: "orange",
    closed: "green",
  };
  return colors[state] || "default";
};
const getStateLabel = (state: string) => {
  const labels: Record<string, string> = {
    open: "开放",
    in_progress: "进行中",
    closed: "已关闭",
  };
  return labels[state] || state;
};
const formatDate = (date: string) => new Date(date).toLocaleString("zh-CN");
</script>
