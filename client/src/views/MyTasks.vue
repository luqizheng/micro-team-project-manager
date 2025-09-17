<template>
  <div class="my-tasks-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <UserOutlined />
          我的任务
        </h1>
        <p class="page-description">查看和管理与我相关的所有任务</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <a-card class="stat-card">
        <a-statistic
          title="总任务数"
          :value="pagination.total"
          :value-style="{ color: '#1890ff' }"
        />
      </a-card>
      <a-card class="stat-card">
        <a-statistic
          title="预估工时"
          :value="stats.totalEstimated"
          suffix="小时"
          :value-style="{ color: '#52c41a' }"
        />
      </a-card>
      <a-card class="stat-card">
        <a-statistic
          title="实际工时"
          :value="stats.totalActual"
          suffix="小时"
          :value-style="{ color: '#fa8c16' }"
        />
      </a-card>
    </div>

    <!-- 筛选和搜索 -->
    <a-card class="filter-card">
      <div class="filter-row">
        <a-input-search
          v-model:value="filters.q"
          placeholder="搜索任务标题..."
          style="width: 300px"
          @search="handleSearch"
          @change="handleSearch"
        />
        
        <a-select
          v-model:value="filters.type"
          placeholder="任务类型"
          style="width: 120px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="task">任务</a-select-option>
          <a-select-option value="requirement">需求</a-select-option>
          <a-select-option value="bug">缺陷</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.state"
          placeholder="状态"
          style="width: 120px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="todo">待办</a-select-option>
          <a-select-option value="in_progress">进行中</a-select-option>
          <a-select-option value="blocked">阻塞</a-select-option>
          <a-select-option value="in_review">待审核</a-select-option>
          <a-select-option value="done">已完成</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.priority"
          placeholder="优先级"
          style="width: 120px"
          allow-clear
          @change="handleSearch"
        >
          <a-select-option value="urgent">紧急</a-select-option>
          <a-select-option value="high">高</a-select-option>
          <a-select-option value="medium">中</a-select-option>
          <a-select-option value="low">低</a-select-option>
        </a-select>

        <a-select
          v-model:value="filters.sortBy"
          placeholder="排序方式"
          style="width: 140px"
          @change="handleSearch"
        >
          <a-select-option value="priority">按优先级</a-select-option>
          <a-select-option value="dueDate">按截止时间</a-select-option>
          <a-select-option value="created">按创建时间</a-select-option>
          <a-select-option value="updated">按更新时间</a-select-option>
        </a-select>
      </div>
    </a-card>

    <!-- 任务列表 -->
    <a-card class="tasks-card">
      <a-spin :spinning="loading">
        <div v-if="tasks.length === 0 && !loading" class="empty-state">
          <a-empty description="暂无相关任务" />
        </div>
        
        <div v-else class="tasks-list">
          <div
            v-for="task in displayedTasks"
            :key="task.id"
            class="task-item"
            :class="getTaskItemClass(task)"
          >
            <!-- 任务优先级标识 -->
            <div class="task-priority" :class="`priority-${task.priority || 'none'}`">
              <div class="priority-dot"></div>
            </div>

            <!-- 任务内容 -->
            <div class="task-content">
              <div class="task-header">
                <div class="task-title">
                  <a-tag :color="getTypeColor(task.type)" class="type-tag">
                    {{ getTypeLabel(task.type) }}
                  </a-tag>
                  <span class="title-text">{{ task.title }}</span>
                  <a-tag v-if="task.key" class="key-tag">{{ task.key }}</a-tag>
                </div>
                
                <div class="task-actions">
                  <a-button
                    type="text"
                    size="small"
                    @click="viewTask(task)"
                  >
                    查看
                  </a-button>
                  <a-button
                    type="text"
                    size="small"
                    @click="editTask(task)"
                  >
                    编辑
                  </a-button>
                </div>
              </div>

              <div class="task-meta">
                <div class="meta-left">
                  <span class="project-info">
                    <FolderOutlined />
                    {{ task.projectName }} ({{ task.projectKey }})
                  </span>
                  <span class="requirement-info" v-if="task.requirementTitle">
                    需求: {{ task.requirementTitle }}
                  </span>
                  <span class="module-info" v-if="task.featureModuleTitle">
                    模块: {{ task.featureModuleTitle }}
                  </span>
                  <span class="subsystem-info" v-if="task.subsystemTitle">
                    子系统: {{ task.subsystemTitle }}
                  </span>
                  
                  <span class="assignee-info" v-if="task.assigneeName">
                    <UserOutlined />
                    {{ task.assigneeName }}
                  </span>
                  
                  <span class="reporter-info" v-if="task.reporterName">
                    <EditOutlined />
                    {{ task.reporterName }}
                  </span>
                </div>

                <div class="meta-right">
                  <span class="state-badge" :class="`state-${task.state}`">
                    {{ getStateLabel(task.state) }}
                  </span>
                  
                  <span v-if="task.dueAt" class="due-date" :class="getDueDateClass(task.dueAt)">
                    <CalendarOutlined />
                    {{ formatDate(task.dueAt) }}
                  </span>
                </div>
              </div>

              <!-- 工时信息 -->
              <div v-if="task.estimatedHours || task.actualHours" class="hours-info">
                <span v-if="task.estimatedHours" class="estimated-hours">
                  预估: {{ task.estimatedHours }}h
                </span>
                <span v-if="task.actualHours" class="actual-hours">
                  实际: {{ task.actualHours }}h
                </span>
              </div>

              <!-- 故事点信息 -->
              <div v-if="task.storyPoints" class="story-points-info">
                <a-tag color="blue" size="small">
                  故事点: {{ task.storyPoints }}
                </a-tag>
              </div>

              <!-- 标签 -->
              <div v-if="task.labels && task.labels.length > 0" class="task-labels">
                <a-tag
                  v-for="label in task.labels"
                  :key="label"
                  size="small"
                  class="label-tag"
                >
                  {{ label }}
                </a-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.total > 0" class="pagination-wrapper">
          <a-pagination
            v-model:current="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :show-size-changer="true"
            :show-quick-jumper="true"
            :show-total="(total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
            @change="handlePageChange"
            @show-size-change="handlePageSizeChange"
          />
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  FolderOutlined,
  EditOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue'
import http from '../api/http'

// 类型定义
interface Task {
  id: string
  key: string
  type: 'task' | 'requirement' | 'bug'
  title: string
  description?: string
  state: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  severity?: string
  assigneeId?: string
  assigneeName?: string
  reporterId?: string
  reporterName?: string
  projectId: string
  projectName: string
  projectKey: string
  requirementId?: string
  requirementTitle?: string
  featureModuleId?: string
  featureModuleTitle?: string
  subsystemId?: string
  subsystemTitle?: string
  estimatedHours?: number
  actualHours?: number
  storyPoints?: number
  dueAt?: string
  labels?: string[]
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface Stats {
  totalEstimated: number
  totalActual: number
}

// 响应式数据
const router = useRouter()
const loading = ref(false)
const tasks = ref<Task[]>([])
const pagination = reactive<Pagination>({
  page: 1,
  pageSize: 20,
  total: 0
})
const stats = reactive<Stats>({
  totalEstimated: 0,
  totalActual: 0
})

const filters = reactive({
  q: '',
  type: undefined as string | undefined,
  state: undefined as string | undefined,
  priority: undefined as string | undefined,
  sortBy: 'priority'
})

// 计算属性
const getTaskItemClass = (task: Task) => {
  const classes = []
  if (task.priority) classes.push(`priority-${task.priority}`)
  if (task.state) classes.push(`state-${task.state}`)
  return classes.join(' ')
}

// 列表展示任务集合：默认仅显示 bug 和 task；当显式选择了类型筛选时，遵循筛选器
const displayedTasks = computed(() => {
  if (filters.type) {
    return tasks.value
  }
  return tasks.value.filter(t => t.type === 'bug' || t.type === 'task')
})

// 方法
const loadTasks = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.page.toString())
    params.append('pageSize', pagination.pageSize.toString())
    params.append('sortBy', filters.sortBy)
    
    if (filters.q) params.append('q', filters.q)
    if (filters.type) params.append('type', filters.type)
    if (filters.state) params.append('state', filters.state)
    if (filters.priority) params.append('priority', filters.priority)

    const response = await http.get(`/my-tasks?${params.toString()}`)
    const data = response.data.data

    let items = data.items || []
    
    // 如果是按优先级排序，在前端进行自定义排序
    if (filters.sortBy === 'priority') {
      items = items.sort((a: Task, b: Task) => {
        const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // 相同优先级按更新时间排序
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    }
    
    tasks.value = items
    pagination.total = data.total || 0
    stats.totalEstimated = data.totalEstimated || 0
    stats.totalActual = data.totalActual || 0
  } catch (error) {
    console.error('加载任务失败:', error)
    message.error('加载任务失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadTasks()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadTasks()
}

const handlePageSizeChange = (_current: number, size: number) => {
  pagination.page = 1
  pagination.pageSize = size
  loadTasks()
}

const viewTask = (task: Task) => {
  const base = `/projects/${task.projectId}`
  const path = task.type === 'requirement'
    ? `${base}/requirements`
    : task.type === 'bug'
    ? `${base}/bugs`
    : `${base}/tasks`
  router.push(path)
}

const editTask = (task: Task) => {
  // 跳转到对应列表页进行编辑
  viewTask(task)
}

// 工具函数
const getTypeColor = (type: string) => {
  const colors = {
    task: 'blue',
    requirement: 'green',
    bug: 'red'
  }
  return colors[type as keyof typeof colors] || 'default'
}

const getTypeLabel = (type: string) => {
  const labels = {
    task: '任务',
    requirement: '需求',
    bug: '缺陷'
  }
  return labels[type as keyof typeof labels] || type
}

const getStateLabel = (state: string) => {
  const labels = {
    todo: '待办',
    in_progress: '进行中',
    blocked: '阻塞',
    in_review: '待审核',
    done: '已完成'
  }
  return labels[state as keyof typeof labels] || state
}

const getDueDateClass = (dueAt: string) => {
  const now = new Date()
  const due = new Date(dueAt)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 1) return 'urgent'
  if (diffDays <= 3) return 'warning'
  return 'normal'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 生命周期
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.my-tasks-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.page-description {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.tasks-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.task-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.task-priority {
  width: 4px;
  height: 100%;
  border-radius: 2px;
  flex-shrink: 0;
}

.priority-urgent { background: #ffa2a4; }
.priority-high { background: #fffac4; }
.priority-medium { background: #faad14; }
.priority-low { background: #52c41a; }
.priority-none { background: #d9d9d9; }

.priority-dot {
  width: 100%;
  height: 100%;
  border-radius: 2px;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.title-text {
  font-weight: 500;
  color: #262626;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.type-tag {
  flex-shrink: 0;
}

.key-tag {
  flex-shrink: 0;
  font-family: monospace;
  font-size: 12px;
}

.task-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.project-info,
.assignee-info,
.reporter-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

.state-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.state-todo { background: #f0f0f0; color: #595959; }
.state-in_progress { background: #e6f7ff; color: #1890ff; }
.state-blocked { background: #fff2e8; color: #fa8c16; }
.state-in_review { background: #f6ffed; color: #52c41a; }
.state-done { background: #f6ffed; color: #52c41a; }

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.due-date.overdue { color: #ff4d4f; }
.due-date.urgent { color: #fa8c16; }
.due-date.warning { color: #faad14; }
.due-date.normal { color: #8c8c8c; }

.hours-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
}

.estimated-hours {
  color: #52c41a;
}

.actual-hours {
  color: #fa8c16;
}

.task-labels {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.label-tag {
  font-size: 11px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .my-tasks-page {
    padding: 16px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-row > * {
    width: 100%;
  }
  
  .task-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .task-actions {
    justify-content: flex-end;
  }
  
  .meta-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .meta-right {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 故事点样式 */
.story-points-info {
  margin-top: 8px;
}
</style>
