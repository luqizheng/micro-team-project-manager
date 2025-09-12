<template>
  <a-card title="事项列表" :bordered="false">
    <a-space style="margin-bottom: 12px">
      <a-input
        v-model:value="q"
        placeholder="搜索标题"
        allow-clear
        style="width: 240px"
      />
      <a-select
        v-model:value="type"
        placeholder="类型"
        allow-clear
        style="width: 140px"
      >
        <a-select-option value="task">任务</a-select-option>
        <a-select-option value="requirement">需求</a-select-option>
        <a-select-option value="bug">缺陷</a-select-option>
      </a-select>
      <StateSelector
        v-model="state"
        :project-id="projectId"
        :issue-type="type || 'task'"
        placeholder="状态"
        allow-clear
        style="width: 140px"
      />
      <UserSelector
        v-model="assigneeId"
        placeholder="负责人"
        :project-id="projectId"
        style="width: 200px"
        allow-clear
      />
      <a-button type="primary" @click="load">搜索</a-button>
      <a-button type="primary" @click="showCreateModal">新建事项</a-button>
      <a-button
        :type="quickEntryVisible ? 'primary' : 'default'"
        @click="toggleQuickEntry"
      >
        {{ quickEntryVisible ? "收起快速录入" : "快速录入" }}
      </a-button>
      <a-button
        :type="treeView ? 'primary' : 'default'"
        @click="toggleTreeView"
      >
        {{ treeView ? "列表视图" : "树形视图" }}
      </a-button>
    </a-space>

    <!-- 快速录入区域 -->
    <a-card
      v-if="quickEntryVisible"
      size="small"
      style="margin-bottom: 16px; background: #fafafa"
    >
      <template #title>
        <a-space>
          <span>快速录入</span>
          <a-tag color="blue">按 Enter 快速创建</a-tag>
        </a-space>
      </template>

      <a-form
        layout="inline"
        :model="quickForm"
        @submit.prevent="handleQuickSubmit"
      >
        <a-form-item
          label="标题"
          required
          style="margin-right: 16px; margin-bottom: 8px"
        >
          <a-input
            v-model:value="quickForm.title"
            placeholder="输入任务标题..."
            style="width: 300px"
            @keydown.enter="handleQuickSubmit"
            ref="titleInput"
          />
        </a-form-item>

        <a-form-item
          label="类型"
          style="margin-right: 16px; margin-bottom: 8px"
        >
          <a-select
            v-model:value="quickForm.type"
            style="width: 120px"
            @change="onTypeChange"
          >
            <a-select-option value="task">任务</a-select-option>
            <a-select-option value="requirement">需求</a-select-option>
            <a-select-option value="bug">缺陷</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          v-if="quickForm.type === 'task'"
          label="计划时间"
          style="margin-right: 16px; margin-bottom: 8px"
        >
          <a-input-number
            v-model:value="quickForm.estimatedHours"
            placeholder="小时"
            :min="0"
            :precision="1"
            style="width: 100px"
          />
        </a-form-item>

        <a-form-item
          label="父任务"
          style="margin-right: 16px; margin-bottom: 8px"
        >
          <IssueSelector
            v-model="quickForm.parentId"
            :project-id="projectId"
            placeholder="选择父任务"
            :exclude-children="true"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>

        <a-form-item style="margin-bottom: 8px">
          <a-space>
            <a-button
              type="primary"
              @click="handleQuickSubmit"
              :loading="quickSubmitting"
            >
              创建
            </a-button>
            <a-button @click="resetQuickForm">清空</a-button>
            <a-button
              type="link"
              @click="showQuickDescription = !showQuickDescription"
            >
              {{ showQuickDescription ? "隐藏" : "添加" }}描述
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 可展开的描述输入区域 -->
      <div v-if="showQuickDescription" style="margin-top: 12px">
        <a-form-item label="描述">
          <ByteMDEditor
            v-model="quickForm.description"
            placeholder="输入任务描述（可选）..."
            :max-length="1000"
            :project-id="projectId"
            style="width: 100%"
          />
        </a-form-item>
      </div>
    </a-card>
    <a-table
      :columns="columns"
      :data-source="items"
      :pagination="treeView ? false : pagination"
      :loading="loading"
      :row-key="treeView ? 'id' : 'id'"
      :default-expand-all-rows="treeView"
      :children-column-name="treeView ? 'children' : undefined"
      @change="onTableChange"
    >
      <template #title="{ record }">
        <a
          v-if="record"
          @click="
            () => router.push(`/projects/${projectId}/issues/${record.id}`)
          "
          >{{ record.title }}</a
        >
      </template>
      <template #assignee="{ record }">
        <span v-if="record.assigneeName">{{ record.assigneeName }}</span>
        <span v-else class="text-muted">未分配</span>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button type="link" size="small" @click="editIssue(record)"
            >编辑</a-button
          >
          <a-button type="link" size="small" danger @click="deleteIssue(record)"
            >删除</a-button
          >
        </a-space>
      </template>
      <template #summary>
        <a-table-summary fixed>
          <a-table-summary-row>
            <a-table-summary-cell :index="0" :col-span="3"
              >合计</a-table-summary-cell
            >
            <a-table-summary-cell :index="3">{{
              totalEstimated
            }}</a-table-summary-cell>
            <a-table-summary-cell :index="4">{{
              totalActual
            }}</a-table-summary-cell>
          </a-table-summary-row>
        </a-table-summary>
      </template>
      <template #emptyText>
        <div style="padding: 12px">
          <div style="color: #999; margin-bottom: 8px">暂无事项</div>
          <a-button type="link" @click="load">重试</a-button>
        </div>
      </template>
    </a-table>

    <!-- 创建/编辑事项模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑事项' : '新建事项'"
      :confirm-loading="modalLoading"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="900px"
    >
      <a-form
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="标题" required>
          <a-input
            v-model:value="formData.title"
            placeholder="请输入事项标题"
          />
        </a-form-item>

        <a-form-item label="类型" required>
          <a-select v-model:value="formData.type" placeholder="请选择类型">
            <a-select-option value="task">任务</a-select-option>
            <a-select-option value="requirement">需求</a-select-option>
            <a-select-option value="bug">缺陷</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="父级事项">
          <IssueSelector
            v-model="formData.parentId"
            :project-id="projectId"
            placeholder="选择父级事项（可选）"
            :exclude-children="true"
            :exclude-id="editingId"
          />
        </a-form-item>

        <a-form-item label="负责人">
          <UserSelector
            v-model="formData.assigneeId"
            placeholder="请选择负责人"
            :project-id="projectId"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="报告人">
          <UserSelector
            v-model="formData.reporterId"
            placeholder="请选择报告人"
            :project-id="projectId"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="状态">
          <StateSelector
            v-model="formData.state"
            :project-id="projectId"
            :issue-type="formData.type"
            placeholder="请选择状态"
          />
        </a-form-item>

        <a-form-item label="预估工时">
          <a-input-number
            v-model:value="formData.estimatedHours"
            placeholder="预估工时（小时）"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="实际工时">
          <a-input-number
            v-model:value="formData.actualHours"
            placeholder="实际工时（小时）"
            :min="0"
            :precision="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="描述">
          <ByteMDEditor
            v-model="formData.description"
            placeholder="请输入事项描述（支持Markdown格式）"
            :max-length="5000"
            :project-id="projectId"
            :issue-id="editingId"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from "vue";
import http from "../api/http";
import { useRoute, useRouter } from "vue-router";
import { useLoading } from "../composables/useLoading";
import { message, Modal } from "ant-design-vue";
import UserSelector from "../components/UserSelector.vue";
import ByteMDEditor from "../components/ByteMDEditor.vue";
import IssueSelector from "../components/IssueSelector.vue";
import StateSelector from "../components/StateSelector.vue";

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const { loading, withLoading } = useLoading();
const items = ref<any[]>([]);
const q = ref("");
const type = ref<string | undefined>();
const state = ref<string | undefined>();
const assigneeId = ref<string | undefined>();
const pagination = ref({ current: 1, pageSize: 10, total: 0 });
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<"ascend" | "descend" | undefined>(undefined);
const treeView = ref(false);

// 快速录入相关
const quickEntryVisible = ref(false);
const quickSubmitting = ref(false);
const showQuickDescription = ref(false);
const titleInput = ref();

// 快速录入表单数据
const quickForm = reactive({
  title: "",
  type: "task" as "task" | "requirement" | "bug",
  parentId: undefined as string | undefined,
  estimatedHours: undefined as number | undefined,
  description: "",
});

// 模态框相关
const modalVisible = ref(false);
const modalLoading = ref(false);
const isEdit = ref(false);
const editingId = ref<string | undefined>();

// 表单数据
const formData = reactive({
  title: "",
  type: "task" as "task" | "requirement" | "bug",
  parentId: undefined as string | undefined,
  assigneeId: undefined as string | undefined,
  reporterId: undefined as string | undefined,
  state: "open",
  estimatedHours: undefined as number | undefined,
  actualHours: undefined as number | undefined,
  description: "",
});

const columns = [
  {
    title: "标题",
    dataIndex: "title",
    key: "title",
    slots: { customRender: "title" },
    sorter: true,
  },
  { title: "类型", dataIndex: "type" },
  { title: "状态", dataIndex: "state", sorter: true },
  {
    title: "负责人",
    dataIndex: "assigneeId",
    key: "assignee",
    slots: { customRender: "assignee" },
  },
  { title: "预估(小时)", dataIndex: "estimatedHours", sorter: true },
  { title: "实际(小时)", dataIndex: "actualHours", sorter: true },
  {
    title: "操作",
    key: "actions",
    slots: { customRender: "actions" },
    width: 120,
  },
];

const totalEstimated = ref(0);
const totalActual = ref(0);

async function load() {
  await withLoading(async () => {
    try {
      const { current, pageSize } = pagination.value as any;
      const params: any = {
        page: current,
        pageSize,
        q: q.value,
        type: type.value,
        state: state.value,
        assigneeId: assigneeId.value,
        sortField: sortField.value,
        sortOrder:
          sortOrder.value === "ascend"
            ? "ASC"
            : sortOrder.value === "descend"
            ? "DESC"
            : undefined,
      };

      if (treeView.value) {
        params.treeView = "true";
      }

      const res = await http.get(`/projects/${projectId}/issues`, { params });

      items.value = res.data.data?.items || [];
      pagination.value.total = res.data.data?.total || 0;
      totalEstimated.value = res.data.data?.totalEstimated || 0;
      totalActual.value = res.data.data?.totalActual || 0;
    } catch (e) {
      message.error("加载事项失败");
      items.value = []; // 确保在出错时清空数据
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

// 显示创建模态框
function showCreateModal() {
  isEdit.value = false;
  editingId.value = undefined;
  resetForm();
  modalVisible.value = true;
}

// 编辑事项
function editIssue(record: any) {
  isEdit.value = true;
  editingId.value = record.id;
  Object.assign(formData, {
    title: record.title,
    type: record.type,
    parentId: record.parentId,
    assigneeId: record.assigneeId,
    reporterId: record.reporterId,
    state: record.state,
    estimatedHours: record.estimatedHours,
    actualHours: record.actualHours,
    description: record.description || "",
  });
  modalVisible.value = true;
}

// 删除事项
function deleteIssue(record: any) {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除事项"${record.title}"吗？`,
    onOk: async () => {
      try {
        await http.delete(`/projects/${projectId}/issues/${record.id}`);
        message.success("删除成功");
        load();
      } catch (e) {
        message.error("删除失败");
      }
    },
  });
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    title: "",
    type: "task",
    parentId: undefined,
    assigneeId: undefined,
    reporterId: undefined,
    state: "open",
    estimatedHours: undefined,
    actualHours: undefined,
    description: "",
  });
}

// 提交表单
async function handleSubmit() {
  if (!formData.title.trim()) {
    message.error("请输入事项标题");
    return;
  }

  modalLoading.value = true;
  try {
    const data = {
      ...formData,
      projectId,
    };

    if (isEdit.value && editingId.value) {
      await http.put(`/projects/${projectId}/issues/${editingId.value}`, data);
      message.success("更新成功");
    } else {
      await http.post(`/projects/${projectId}/issues`, data);
      message.success("创建成功");
    }

    modalVisible.value = false;
    load();
  } catch (e) {
    message.error(isEdit.value ? "更新失败" : "创建失败");
  } finally {
    modalLoading.value = false;
  }
}

// 取消
function handleCancel() {
  modalVisible.value = false;
  resetForm();
}

// 切换树形视图
function toggleTreeView() {
  treeView.value = !treeView.value;
  load();
}

// 切换快速录入
function toggleQuickEntry() {
  quickEntryVisible.value = !quickEntryVisible.value;
  if (quickEntryVisible.value) {
    // 展开时聚焦到标题输入框
    nextTick(() => {
      titleInput.value?.focus();
    });
  }
}

// 类型改变时的处理
function onTypeChange() {
  // 非任务类型时清空预估工时
  if (quickForm.type !== "task") {
    quickForm.estimatedHours = undefined;
  }
}

// 快速提交
async function handleQuickSubmit() {
  if (!quickForm.title.trim()) {
    message.error("请输入任务标题");
    titleInput.value?.focus();
    return;
  }

  quickSubmitting.value = true;
  try {
    const data = {
      ...quickForm,
      projectId,
      state: "todo", // 默认状态
    };

    await http.post(`/projects/${projectId}/issues`, data);
    message.success("创建成功");

    // 重置表单并保持焦点
    resetQuickForm();
    titleInput.value?.focus();

    // 刷新列表
    load();
  } catch (e) {
    message.error("创建失败");
  } finally {
    quickSubmitting.value = false;
  }
}

// 重置快速录入表单
function resetQuickForm() {
  Object.assign(quickForm, {
    title: "",
    type: "task",
    parentId: undefined,
    estimatedHours: undefined,
    description: "",
  });
  showQuickDescription.value = false;
}

onMounted(load);
</script>

<style scoped>
.text-muted {
  color: #999;
}
</style>
