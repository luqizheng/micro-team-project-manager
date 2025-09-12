<template>
  <div class="project-member-manager">
    <div class="member-header">
      <h3>项目成员</h3>
      <a-button
        type="primary"
        @click="showAddModal = true"
        :disabled="!canManageMembers"
      >
        添加成员
      </a-button>
    </div>

    <!-- 成员列表 -->
    <a-table
      :columns="memberColumns"
      :data-source="members"
      :pagination="memberPagination"
      :loading="memberLoading"
      row-key="id"
      @change="onMemberTableChange"
    >
      <template #avatar="{ record }">
        <a-avatar :src="record.avatar" :size="32">
          {{ record.name?.charAt(0)?.toUpperCase() }}
        </a-avatar>
      </template>

      <template #role="{ record }">
        <a-tag :color="record.role === 'project_manager' ? 'blue' : 'default'">
          {{ record.role === "project_manager" ? "项目经理" : "成员" }}
        </a-tag>
      </template>

      <template #joinedAt="{ record }">
        {{ formatDate(record.joinedAt) }}
      </template>

      <template #action="{ record }">
        <a-space>
          <a-dropdown v-if="canManageMembers">
            <template #overlay>
              <a-menu @click="({ key }) => handleRoleChange(record, key)">
                <a-menu-item key="member" :disabled="record.role === 'member'">
                  设为成员
                </a-menu-item>
                <a-menu-item
                  key="project_manager"
                  :disabled="record.role === 'project_manager'"
                >
                  设为项目经理
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="link" size="small">
              角色 <DownOutlined />
            </a-button>
          </a-dropdown>
          <a-button
            v-if="canManageMembers"
            type="link"
            size="small"
            danger
            @click="handleRemoveMember(record)"
          >
            移除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 添加成员模态框 -->
    <a-modal
      v-model:open="showAddModal"
      title="添加项目成员"
      :confirm-loading="addLoading"
      @ok="handleAddMember"
      @cancel="resetAddForm"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="选择用户" required>
          <UserSelector v-model="addForm.userId" placeholder="搜索并选择用户" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-radio-group v-model:value="addForm.role">
            <a-radio value="member">成员</a-radio>
            <a-radio value="project_manager">项目经理</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import { DownOutlined } from "@ant-design/icons-vue";
import http from "../api/http";
import { useLoading } from "../composables/useLoading";
import { useAuthStore } from "../stores/auth";
import UserSelector from "./UserSelector.vue";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "member" | "project_manager";
  joinedAt: string;
}

interface AddForm {
  userId: string;
  role: "member" | "project_manager";
}

const props = defineProps<{
  projectId: string;
}>();

const { loading: memberLoading, withLoading } = useLoading();
const auth = useAuthStore();

const canManageMembers = computed(() =>
  auth.hasAnyRole(["admin", "project_manager"])
);

const members = ref<Member[]>([]);
const memberPagination = ref({ current: 1, pageSize: 10, total: 0 });
const memberSearch = ref("");

const showAddModal = ref(false);
const addLoading = ref(false);
const addForm = ref<AddForm>({
  userId: "",
  role: "member",
});

const memberColumns = [
  {
    title: "头像",
    dataIndex: "avatar",
    key: "avatar",
    slots: { customRender: "avatar" },
    width: 80,
  },
  {
    title: "姓名",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "邮箱",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "角色",
    dataIndex: "role",
    key: "role",
    slots: { customRender: "role" },
  },
  {
    title: "加入时间",
    dataIndex: "joinedAt",
    key: "joinedAt",
    slots: { customRender: "joinedAt" },
  },
  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
    width: 150,
  },
];

// 加载成员列表
async function loadMembers() {
  await withLoading(async () => {
    try {
      const { current, pageSize } = memberPagination.value;
      const res = await http.get(`/projects/${props.projectId}/members`, {
        params: {
          page: current,
          pageSize,
          q: memberSearch.value,
        },
      });
      members.value = res.data.data.items;
      memberPagination.value.total = res.data.data.total;
    } catch (error: any) {
      message.error("加载成员列表失败");
      console.error("Load members error:", error);
    }
  });
}

// 成员表格变化
function onMemberTableChange(pagination: any) {
  memberPagination.value = {
    ...memberPagination.value,
    current: pagination.current,
    pageSize: pagination.pageSize,
  };
  loadMembers();
}

// 添加成员
async function handleAddMember() {
  if (!addForm.value.userId) {
    message.warning("请选择用户");
    return;
  }

  addLoading.value = true;
  try {
    await http.post(`/projects/${props.projectId}/members`, {
      userId: addForm.value.userId,
      role: addForm.value.role,
    });
    message.success("添加成员成功");
    resetAddForm();
    await loadMembers();
  } catch (error: any) {
    message.error(error.response?.data?.message || "添加成员失败");
  } finally {
    addLoading.value = false;
  }
}

// 重置添加表单
function resetAddForm() {
  showAddModal.value = false;
  addForm.value = {
    userId: "",
    role: "member",
  };
}

// 角色变更
async function handleRoleChange(member: Member, newRole: string) {
  try {
    await http.patch(`/projects/${props.projectId}/members/${member.id}`, {
      role: newRole,
    });
    message.success("角色更新成功");
    await loadMembers();
  } catch (error: any) {
    message.error(error.response?.data?.message || "角色更新失败");
  }
}

// 移除成员
async function handleRemoveMember(member: Member) {
  if (!confirm(`确认移除成员 ${member.name}？`)) {
    return;
  }

  try {
    await http.delete(`/projects/${props.projectId}/members/${member.id}`);
    message.success("移除成员成功");
    await loadMembers();
  } catch (error: any) {
    message.error(error.response?.data?.message || "移除成员失败");
  }
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN");
}

onMounted(() => {
  loadMembers();
});
</script>

<style scoped>
.project-member-manager {
  margin-top: 24px;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.member-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
</style>
