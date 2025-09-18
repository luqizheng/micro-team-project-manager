<template>
  <a-card title="功能模块管理" :bordered="false">
    <Toolbar
      :searchKeyword="searchKeyword"
      :stateFilter="stateFilter"
      @update:searchKeyword="(val) => (searchKeyword = val)"
      @update:stateFilter="(val) => (stateFilter = val)"
      @search="loadFeatureModules"
      @create="showCreateModal"
    />

    <FeatureTable
      :data-source="featureModules"
      :loading="loading"
      @view="viewDetail"
      @edit="editFeatureModule"
      @delete="deleteFeatureModule"
    />

    <FormModal
      :open="modalVisible"
      :isEdit="isEdit"
      :projectId="props.projectId"
      :formData="formData"
      :currentId="selectedFeatureModule?.id"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DetailModal :open="detailModalVisible" :record="selectedFeatureModule" />
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import http from "../api/http";
import { useLoading } from "../composables/useLoading";
import Toolbar from "./FeatureModules/Toolbar.vue";
import FeatureTable from "./FeatureModules/Table.vue";
import FormModal, { FeatureModuleForm } from "./FeatureModules/FormModal.vue";
import DetailModal from "./FeatureModules/DetailModal.vue";

interface FeatureModule {
  id: string;
  title: string;
  description?: string;
  state: string;
  assigneeId?: string;
  assignee?: { id: string; name: string; avatar?: string };
  labels: string[];
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  children?: FeatureModule[];
}

const props = defineProps<{ projectId: string }>();
const { loading, withLoading } = useLoading();

// 数据状态
const featureModules = ref<FeatureModule[]>([]);
let searchKeyword = ref("");
let stateFilter = ref("");

// 分页已移除，采用树模型一次性加载所有数据

// 模态框状态
const modalVisible = ref(false);
const detailModalVisible = ref(false);
const isEdit = ref(false);
const selectedFeatureModule = ref<FeatureModule | null>(null);

// 表单数据
const formData = ref<FeatureModuleForm>({
  title: "",
  description: "",
  state: "open",
  assigneeId: undefined,
  labels: [],
  parentId: undefined,
});

// 工具函数（如需扩展可在此添加）

// 从扁平数据构建树
const buildTreeFromFlat = (items: FeatureModule[] = []): FeatureModule[] => {
  const map = new Map<string, FeatureModule>();
  const roots: FeatureModule[] = [];
  for (const item of items) map.set(item.id, { ...item, children: undefined });
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

// 加载列表 - 一次性加载所有数据用于树模型显示
const loadFeatureModules = () =>
  withLoading(async () => {
    try {
      const params = {
        page: 1,
        pageSize: 10000, // 一次性加载大量数据
        q: searchKeyword.value,
        state: stateFilter.value,
      };
      const response = await http.get(
        `/projects/${props.projectId}/feature-modules`,
        { params }
      );
      const data = response.data.data;
      const flatItems: FeatureModule[] = data.items || [];
      featureModules.value = buildTreeFromFlat(flatItems);
    } catch (error) {
      message.error("加载功能模块列表失败");
      console.error("Load feature modules error:", error);
    }
  });

// 表格变化已移除，采用树模型无需分页

// 显示创建
const showCreateModal = () => {
  isEdit.value = false;
  formData.value = {
    title: "",
    description: "",
    state: "open",
    assigneeId: undefined,
    labels: [],
    parentId: undefined,
  };
  modalVisible.value = true;
};

// 编辑
const editFeatureModule = (featureModule: FeatureModule) => {
  isEdit.value = true;
  selectedFeatureModule.value = featureModule;
  formData.value = {
    title: featureModule.title,
    description: featureModule.description || "",
    state: featureModule.state,
    assigneeId: featureModule.assigneeId,
    labels: [...featureModule.labels],
    parentId: featureModule.parentId,
  };
  modalVisible.value = true;
};

// 详情
const viewDetail = (featureModule: FeatureModule) => {
  selectedFeatureModule.value = featureModule;
  detailModalVisible.value = true;
};

// 提交
const handleSubmit = async () => {
  try {
    const submitData: any = {
      ...formData.value,
    };
    if (isEdit.value) {
      await http.put(
        `/projects/${props.projectId}/feature-modules/${selectedFeatureModule.value?.id}`,
        submitData
      );
      message.success("功能模块更新成功");
    } else {
      await http.post(
        `/projects/${props.projectId}/feature-modules`,
        submitData
      );
      message.success("功能模块创建成功");
    }
    modalVisible.value = false;
    loadFeatureModules();
  } catch (error) {
    message.error(isEdit.value ? "更新功能模块失败" : "创建功能模块失败");
    console.error("Submit feature module error:", error);
  }
};

// 取消
const handleCancel = () => {
  modalVisible.value = false;
};

// 删除
const deleteFeatureModule = async (id: string) => {
  try {
    await http.delete(`/projects/${props.projectId}/feature-modules/${id}`);
    message.success("功能模块删除成功");
    loadFeatureModules();
  } catch (error) {
    message.error("删除功能模块失败");
    console.error("Delete feature module error:", error);
  }
};

onMounted(() => {
  loadFeatureModules();
});
</script>

<style scoped>
.feature-module-detail {
  max-height: 600px;
  overflow-y: auto;
}
.text-gray-400 {
  color: #9ca3af;
}
</style>
