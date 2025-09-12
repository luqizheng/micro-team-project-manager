<template>
  <a-card title="项目列表" :bordered="false">
    <a-space style="margin-bottom: 12px">
      <a-input
        v-model:value="q"
        placeholder="搜索名称或KEY"
        allow-clear
        style="width: 240px"
      />
      <a-select
        v-model:value="visibility"
        placeholder="可见性"
        allow-clear
        style="width: 140px"
      >
        <a-select-option value="private">private</a-select-option>
        <a-select-option value="public">public</a-select-option>
      </a-select>
      <a-button type="primary" @click="load">搜索</a-button>
      <a-tooltip :title="!canManageProject ? '无权限创建项目' : ''">
        <a-button
          type="primary"
          ghost
          :disabled="!canManageProject"
          @click="openCreate"
          >新建项目</a-button
        >
      </a-tooltip>
    </a-space>
    <a-table
      :columns="columns"
      :data-source="items"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="onTableChange"
    >
      <template #action="{ record }">
        <a-space>
          <a
            :class="{ 'ant-typography-disabled': !canManageProject }"
            @click="canManageProject && edit(record)"
            >编辑</a
          >
          <a
            :class="{ 'ant-typography-disabled': !canManageProject }"
            @click="canManageProject && toggleArchive(record)"
            >{{ record.archived ? "取消归档" : "归档" }}</a
          >
          <a @click="goIssues(record)">事项</a>
          <a @click="goNewIssue(record)">新建事项</a>
          <a @click="goHours(record)">工时报表</a>
          <a @click="goReleases(record)">发布管理</a>
          <a
            :class="{ 'ant-typography-disabled': !canManageProject }"
            style="color: #ff4d4f"
            @click="canManageProject && removeProject(record)"
            >删除</a
          >
        </a-space>
      </template>
      <template #emptyText>
        <div style="padding: 12px">
          <div style="color: #999; margin-bottom: 8px">暂无项目</div>
          <a-button type="link" @click="load">重试</a-button>
        </div>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="modalMode === 'create' ? '新建项目' : '编辑项目'"
      :confirm-loading="saveLoading"
      @ok="save"
      @cancel="closeModal"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="KEY" v-if="modalMode === 'create'" required>
          <a-input
            v-model:value="form.key"
            placeholder="例如: PM"
            maxlength="20"
          />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input
            v-model:value="form.name"
            placeholder="项目名称"
            maxlength="80"
          />
        </a-form-item>
        <a-form-item label="可见性">
          <a-select v-model:value="form.visibility" style="width: 160px">
            <a-select-option value="private">private</a-select-option>
            <a-select-option value="public">public</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import http from "../api/http";
import { useLoading } from "../composables/useLoading";
import { message } from "ant-design-vue";
import { useAuthStore } from "../stores/auth";

const { loading, withLoading } = useLoading();
const auth = useAuthStore();
const canManageProject = computed(() => auth.hasAnyRole(["project_admin"]));

const items = ref<any[]>([]);
const q = ref("");
const visibility = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<"ascend" | "descend" | undefined>(undefined);

const router = useRouter();

const columns = [
  { title: "KEY", dataIndex: "key", sorter: true },
  { title: "名称", dataIndex: "name", sorter: true },
  { title: "可见性", dataIndex: "visibility" },
  { title: "操作", key: "action", slots: { customRender: "action" } },
];

async function load() {
  await withLoading(async () => {
    try {
      const { current, pageSize } = pagination.value as any;
      const res = await http.get("/projects", {
        params: {
          page: current,
          pageSize,
          q: q.value,
          visibility: visibility.value,
          sortField: sortField.value,
          sortOrder:
            sortOrder.value === "ascend"
              ? "ASC"
              : sortOrder.value === "descend"
              ? "DESC"
              : undefined,
        },
      });
      items.value = res.data.data.items;
      pagination.value.total = res.data.data.total;
    } catch (e) {
      message.error("加载项目失败");
    }
  });
}

function onTableChange(p: any, _filters: any, sorter: any) {
  pagination.value = {
    ...pagination.value,
    current: p.current,
    pageSize: p.pageSize,
  } as any;
  if (Array.isArray(sorter)) {
    const s = sorter[0] || {};
    sortField.value = s.field;
    sortOrder.value = s.order;
  } else {
    sortField.value = sorter?.field;
    sortOrder.value = sorter?.order;
  }
  load();
}

onMounted(load);

function goIssues(record: any) {
  router.push(`/projects/${record.id}/issues`);
}
function goNewIssue(record: any) {
  router.push(`/projects/${record.id}/issues/new`);
}
function goHours(record: any) {
  router.push(`/projects/${record.id}/reports/hours`);
}
function goReleases(record: any) {
  router.push(`/projects/${record.id}/releases`);
}

// CRUD 相关
const modalOpen = ref(false);
const modalMode = ref<"create" | "edit">("create");
const saveLoading = ref(false);
const form = ref<{
  id?: string;
  key: string;
  name: string;
  visibility?: "private" | "public";
}>({ key: "", name: "", visibility: "private" });

function openCreate() {
  modalMode.value = "create";
  form.value = { key: "", name: "", visibility: "private" };
  modalOpen.value = true;
}

function edit(record: any) {
  modalMode.value = "edit";
  form.value = {
    id: record.id,
    key: record.key,
    name: record.name,
    visibility: record.visibility,
  };
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

async function save() {
  saveLoading.value = true;
  try {
    if (modalMode.value === "create") {
      await http.post("/projects", {
        key: form.value.key?.toUpperCase(),
        name: form.value.name,
        visibility: form.value.visibility,
      });
    } else if (form.value.id) {
      await http.patch(`/projects/${form.value.id}`, {
        name: form.value.name,
        visibility: form.value.visibility,
      });
    }
    closeModal();
    await load();
  } finally {
    saveLoading.value = false;
  }
}

async function toggleArchive(record: any) {
  await withLoading(async () => {
    await http.patch(`/projects/${record.id}`, { archived: !record.archived });
    await load();
  });
}

async function removeProject(record: any) {
  // 简单确认
  if (!confirm(`确认删除项目 ${record.name} ?`)) return;
  await withLoading(async () => {
    await http.delete(`/projects/${record.id}`);
    await load();
  });
}
</script>
