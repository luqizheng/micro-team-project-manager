<template>
  <a-card title="用户管理" :bordered="false">
    <a-space style="margin-bottom: 12px">
      <a-input
        v-model:value="q"
        placeholder="搜索姓名或邮箱"
        allow-clear
        style="width: 240px"
      />
      <a-select
        v-model:value="status"
        placeholder="状态"
        allow-clear
        style="width: 140px"
      >
        <a-select-option value="active">活跃</a-select-option>
        <a-select-option value="inactive">禁用</a-select-option>
      </a-select>
      <a-button type="primary" @click="load">搜索</a-button>
      <a-tooltip :title="!canManageUsers ? '无权限创建用户' : ''">
        <a-button
          type="primary"
          ghost
          :disabled="!canManageUsers"
          @click="openCreate"
          >新建用户</a-button
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
      <template #status="{ record }">
        <a-tag :color="record.status === 'active' ? 'green' : 'red'">
          {{ record.status === 'active' ? '活跃' : '禁用' }}
        </a-tag>
      </template>
      <template #systemRoles="{ record }">
        <a-space v-if="record.systemRoles && record.systemRoles.length > 0">
          <a-tag v-for="role in record.systemRoles" :key="role" :color="getSystemRoleColor(role)">
            {{ getSystemRoleName(role) }}
          </a-tag>
        </a-space>
        <span v-else style="color: #999;">无</span>
      </template>
      <template #avatar="{ record }">
        <a-avatar :src="record.avatar" :size="32">
          {{ record.name?.charAt(0)?.toUpperCase() }}
        </a-avatar>
      </template>
      <template #action="{ record }">
        <a-space>
          <a
            :class="{ 'ant-typography-disabled': !canManageUsers }"
            @click="canManageUsers && edit(record)"
            >编辑</a
          >
          <a
            :class="{ 'ant-typography-disabled': !canManageUsers }"
            @click="canManageUsers && toggleStatus(record)"
            >{{ record.status === 'active' ? '禁用' : '启用' }}</a
          >
          <a
            :class="{ 'ant-typography-disabled': !canManageUsers }"
            @click="canManageUsers && viewRoles(record)"
            >角色</a
          >
          <a
            :class="{ 'ant-typography-disabled': !canManageUsers }"
            style="color: #ff4d4f"
            @click="canManageUsers && removeUser(record)"
            >删除</a
          >
        </a-space>
      </template>
      <template #emptyText>
        <div style="padding: 12px">
          <div style="color: #999; margin-bottom: 8px">暂无用户</div>
          <a-button type="link" @click="load">重试</a-button>
        </div>
      </template>
    </a-table>

    <!-- 用户表单模态框 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalMode === 'create' ? '新建用户' : '编辑用户'"
      :confirm-loading="saveLoading"
      @ok="save"
      @cancel="closeModal"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="邮箱" required>
          <a-input
            v-model:value="form.email"
            placeholder="用户邮箱"
            :disabled="modalMode === 'edit'"
          />
        </a-form-item>
        <a-form-item label="姓名" required>
          <a-input
            v-model:value="form.name"
            placeholder="用户姓名"
            maxlength="120"
          />
        </a-form-item>
        <a-form-item label="密码" :required="modalMode === 'create'">
          <a-input-password
            v-model:value="form.password"
            placeholder="用户密码"
            :disabled="modalMode === 'edit'"
          />
        </a-form-item>
        <a-form-item label="头像">
          <a-input
            v-model:value="form.avatar"
            placeholder="头像URL"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status" style="width: 160px">
            <a-select-option value="active">活跃</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 用户角色模态框 -->
    <a-modal
      v-model:open="rolesModalOpen"
      title="用户角色管理"
      width="800px"
      @ok="saveRoles"
      @cancel="closeRolesModal"
    >
      <div v-if="selectedUser">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="用户姓名">{{ selectedUser.name }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ selectedUser.email }}</a-descriptions-item>
        </a-descriptions>
        
        <a-divider>项目角色</a-divider>
        
        <a-table
          :columns="rolesColumns"
          :data-source="userMemberships"
          :loading="membershipsLoading"
          :pagination="false"
          size="small"
        >
          <template #role="{ record }">
            <a-tag :color="getRoleColor(record.role)">
              {{ getRoleName(record.role) }}
            </a-tag>
          </template>
          <template #action="{ record }">
            <a-space>
              <a @click="editMembership(record)">编辑</a>
              <a style="color: #ff4d4f" @click="removeMembership(record)">移除</a>
            </a-space>
          </template>
        </a-table>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import http from "../api/http";
import { useLoading } from "../composables/useLoading";
import { message } from "ant-design-vue";
import { useAuthStore } from "../stores/auth";

const { loading, withLoading } = useLoading();
const auth = useAuthStore();
const canManageUsers = computed(() => auth.hasAnyRole(["admin", "project_admin"]));

const items = ref<any[]>([]);
const q = ref("");
const status = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<"ascend" | "descend" | undefined>(undefined);

const columns = [
  { title: "头像", dataIndex: "avatar", key: "avatar", slots: { customRender: "avatar" } },
  { title: "姓名", dataIndex: "name", sorter: true },
  { title: "邮箱", dataIndex: "email", sorter: true },
  { title: "系统角色", dataIndex: "systemRoles", key: "systemRoles", slots: { customRender: "systemRoles" } },
  { title: "状态", dataIndex: "status", key: "status", slots: { customRender: "status" } },
  { title: "创建时间", dataIndex: "createdAt", sorter: true },
  { title: "操作", key: "action", slots: { customRender: "action" } },
];

const rolesColumns = [
  { title: "项目", dataIndex: "projectName" },
  { title: "角色", dataIndex: "role", key: "role", slots: { customRender: "role" } },
  { title: "加入时间", dataIndex: "joinedAt" },
  { title: "操作", key: "action", slots: { customRender: "action" } },
];

async function load() {
  await withLoading(async () => {
    try {
      const { current, pageSize } = pagination.value as any;
      const res = await http.get("/users", {
        params: {
          page: current,
          pageSize,
          q: q.value,
          status: status.value,
        },
      });
      items.value = res.data.data.items;
      pagination.value.total = res.data.data.total;
    } catch (e) {
      message.error("加载用户失败");
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

// CRUD 相关
const modalOpen = ref(false);
const modalMode = ref<"create" | "edit">("create");
const saveLoading = ref(false);
const form = ref<{
  id?: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  status?: "active" | "inactive";
}>({ email: "", name: "", password: "", status: "active" });

function openCreate() {
  modalMode.value = "create";
  form.value = { email: "", name: "", password: "", status: "active" };
  modalOpen.value = true;
}

function edit(record: any) {
  modalMode.value = "edit";
  form.value = {
    id: record.id,
    email: record.email,
    name: record.name,
    password: "",
    avatar: record.avatar,
    status: record.status,
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
      await http.post("/users", {
        email: form.value.email,
        name: form.value.name,
        password: form.value.password,
        avatar: form.value.avatar,
        status: form.value.status,
      });
    } else if (form.value.id) {
      const updateData: any = {
        name: form.value.name,
        avatar: form.value.avatar,
        status: form.value.status,
      };
      if (form.value.password) {
        updateData.password = form.value.password;
      }
      await http.patch(`/users/${form.value.id}`, updateData);
    }
    closeModal();
    await load();
    message.success(modalMode.value === "create" ? "创建成功" : "更新成功");
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    saveLoading.value = false;
  }
}

async function toggleStatus(record: any) {
  const newStatus = record.status === "active" ? "inactive" : "active";
  await withLoading(async () => {
    await http.patch(`/users/${record.id}/status`, { status: newStatus });
    await load();
    message.success(`用户已${newStatus === "active" ? "启用" : "禁用"}`);
  });
}

async function removeUser(record: any) {
  if (!confirm(`确认删除用户 ${record.name} ?`)) return;
  await withLoading(async () => {
    await http.delete(`/users/${record.id}`);
    await load();
    message.success("用户删除成功");
  });
}

// 角色管理相关
const rolesModalOpen = ref(false);
const selectedUser = ref<any>(null);
const userMemberships = ref<any[]>([]);
const membershipsLoading = ref(false);

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: "red",
    project_admin: "blue",
    member: "green",
    viewer: "default",
  };
  return colors[role] || "default";
}

function getRoleName(role: string) {
  const names: Record<string, string> = {
    admin: "系统管理员",
    project_admin: "项目管理员",
    member: "成员",
    viewer: "观察者",
  };
  return names[role] || role;
}

function getSystemRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: "red",
    project_admin: "blue",
    member: "green",
    viewer: "default",
  };
  return colors[role] || "default";
}

function getSystemRoleName(role: string) {
  const names: Record<string, string> = {
    admin: "系统管理员",
    project_admin: "项目管理员",
    member: "成员",
    viewer: "观察者",
  };
  return names[role] || role;
}

async function viewRoles(record: any) {
  selectedUser.value = record;
  rolesModalOpen.value = true;
  await loadUserMemberships(record.id);
}

async function loadUserMemberships(userId: string) {
  membershipsLoading.value = true;
  try {
    const res = await http.get(`/users/${userId}/memberships`);
    userMemberships.value = res.data.data;
  } catch (e) {
    message.error("加载用户角色失败");
  } finally {
    membershipsLoading.value = false;
  }
}

function closeRolesModal() {
  rolesModalOpen.value = false;
  selectedUser.value = null;
  userMemberships.value = [];
}

function editMembership(record: any) {
  // TODO: 实现编辑成员关系
  message.info("编辑成员关系功能待实现");
}

function removeMembership(record: any) {
  // TODO: 实现移除成员关系
  message.info("移除成员关系功能待实现");
}

function saveRoles() {
  // TODO: 实现保存角色变更
  closeRolesModal();
}
</script>
