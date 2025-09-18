<template>
  <a-modal
    :open="open"
    :title="isEdit ? '编辑功能模块' : '新建功能模块'"
    width="800px"
    @ok="emit('submit')"
    @cancel="emit('cancel')"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <a-form-item label="父模块" name="parentId">
        <a-select
          v-model:value="formData.parentId"
          placeholder="请选择父模块（可选）"
          :loading="parentLoading"
          allow-clear
          show-search
          :filter-option="filterParentOption"
        >
          <a-select-option
            v-for="fm in parentOptions"
            :key="fm.id"
            :value="fm.id"
            :disabled="currentId && fm.id === currentId"
          >
            {{ fm.title }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="名称" name="title">
        <a-input v-model:value="formData.title" placeholder="请输入功能模块名称" />
      </a-form-item>

      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="formData.description"
          placeholder="请输入功能模块描述"
          :rows="4"
        />
      </a-form-item>

      <a-form-item label="状态" name="state">
        <a-select v-model:value="formData.state" placeholder="请选择状态">
          <a-select-option value="open">开放</a-select-option>
          <a-select-option value="in_progress">进行中</a-select-option>
          <a-select-option value="closed">已关闭</a-select-option>
        </a-select>
      </a-form-item>

      

      <a-form-item label="负责人" name="assigneeId">
        <UserSelector
          v-model="formData.assigneeId"
          :project-id="projectId"
          placeholder="请选择负责人"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="标签" name="labels">
        <a-select
          v-model:value="formData.labels"
          mode="tags"
          placeholder="请输入标签"
          :token-separators="[',']"
        />
      </a-form-item>

      
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import UserSelector from '../../components/UserSelector.vue'
import http from '../../api/http'

export interface FeatureModuleForm {
  title: string;
  description: string;
  state: string;
  assigneeId?: string;
  labels: string[];
  parentId?: string;
}

const props = defineProps<{
  open: boolean;
  isEdit: boolean;
  projectId: string;
  formData: FeatureModuleForm;
  currentId?: string;
}>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const formRules = {
  title: [{ required: true, message: '请输入功能模块名称', trigger: 'blur' }],
  state: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

defineExpose({ formRef })

// 父模块选项加载
const parentOptions = ref<Array<{ id: string; title: string }>>([])
const parentLoading = ref(false)

const loadParentOptions = async () => {
  parentLoading.value = true
  try {
    const { data } = await http.get(`/projects/${props.projectId}/feature-modules`, {
      params: { page: 1, pageSize: 1000 }
    })
    const items = (data?.data?.items || []) as Array<{ id: string; title: string }>
    parentOptions.value = items
  } finally {
    parentLoading.value = false
  }
}

const filterParentOption = (input: string, option: any) =>
  option?.children?.toLowerCase?.().includes(input.toLowerCase())

onMounted(() => {
  loadParentOptions()
})
</script>


