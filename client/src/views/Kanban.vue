<template>
  <div class="kanban-container">
    <a-card title="看板视图" :bordered="false">
      <template #extra>
        <a-space>
          <a-input
            v-model:value="searchText"
            placeholder="搜索事项... (Ctrl+K)"
            style="width: 200px"
            @input="debouncedSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
          <a-select
            v-model:value="selectedBoardId"
            placeholder="选择看板"
            style="width: 200px"
            @change="loadKanbanData"
          >
            <a-select-option
              v-for="board in boards"
              :key="board.id"
              :value="board.id"
            >
              {{ board.name }}
            </a-select-option>
          </a-select>
          <a-button type="primary" @click="showBoardConfig">
            看板配置
          </a-button>
          <a-button @click="refreshKanban">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </a-space>
      </template>

      <div v-if="loading" class="loading-container">
        <div class="loading-content">
          <a-spin size="large" />
          <p class="loading-text">加载看板数据中...</p>
        </div>
      </div>

      <div v-else-if="!selectedBoardId && boards.length === 0" class="empty-container">
        <a-empty description="暂无看板，请先创建看板">
          <template #extra>
            <a-button type="primary" @click="showBoardConfig">
              创建看板
            </a-button>
          </template>
        </a-empty>
      </div>

      <div v-else-if="!selectedBoardId && boards.length > 0" class="empty-container">
        <a-empty description="请选择一个看板">
          <template #extra>
            <a-button type="primary" @click="selectFirstBoard">
              选择第一个看板
            </a-button>
          </template>
        </a-empty>
      </div>

      <div v-else class="kanban-board">
        <!-- 骨架屏 -->
        <div v-if="!kanbanData" class="kanban-skeleton">
          <div v-for="i in 4" :key="i" class="skeleton-column">
            <div class="skeleton-header"></div>
            <div class="skeleton-content">
              <div v-for="j in 3" :key="j" class="skeleton-card"></div>
            </div>
          </div>
        </div>

        <!-- 搜索结果统计 -->
        <div v-if="kanbanData && searchText.trim()" class="search-results-info">
          <a-tag color="blue">
            找到 {{ getTotalFilteredIssues() }} 个事项
          </a-tag>
          <a-button type="link" size="small" @click="clearSearch">
            清除搜索
          </a-button>
        </div>

        <!-- 实际看板内容 -->
        <div v-else class="kanban-columns">
          <div
            v-for="column in (filteredKanbanData || kanbanData)?.columns || []"
            :key="column.id"
            class="kanban-column"
            :class="{ 'drag-over': dragOverColumn?.id === column.id }"
            :style="{ borderColor: column.color }"
            :data-column-id="column.id"
          >
            <div class="column-header">
              <div class="column-title">
                <span class="column-name">{{ column.name }}</span>
                <div class="column-stats">
                  <a-tag :color="getWipColor(column)" size="small">
                    {{ column.issues?.length || 0 }}{{ column.wipLimit ? `/${column.wipLimit}` : '' }}
                  </a-tag>
                  <a-tag v-if="column.wipLimit" :color="getWipStatusColor(column)" size="small">
                    {{ getWipStatus(column) }}
                  </a-tag>
                </div>
              </div>
            </div>

            <div 
              class="column-content"
              :class="{ 'drag-over': dragOverColumn?.id === column.id }"
              @drop="handleDrop($event, column)"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
            >
              <div
                v-for="issue in column.issues || []"
                :key="issue.id"
                class="kanban-card"
                :draggable="true"
                @dragstart="handleDragStart($event, issue)"
                @dragend="handleDragEnd"
                @click="viewIssue(issue)"
              >
                <div class="card-header">
                  <a-tag :color="getTypeColor(issue.type)" size="small">
                    {{ getTypeName(issue.type) }}
                  </a-tag>
                  <div class="card-actions">
                    <span class="issue-id">#{{ issue.id.slice(-8) }}</span>
                    <a-dropdown :trigger="['click']" @click.stop>
                      <template #overlay>
                        <a-menu @click="({ key }) => handleIssueAction(key, issue)">
                          <a-menu-item key="view">查看列表</a-menu-item>
                        </a-menu>
                      </template>
                      <a-button type="text" size="small" @click.stop>
                        <EllipsisOutlined />
                      </a-button>
                    </a-dropdown>
                  </div>
                </div>
                
                <div class="card-title">{{ issue.title }}</div>
                
                <div class="card-footer">
                  <div class="assignee">
                    <a-avatar v-if="issue.assigneeName" size="small">
                      {{ issue.assigneeName.charAt(0) }}
                    </a-avatar>
                    <span v-else class="no-assignee">未分配</span>
                  </div>
                  
                  <div class="card-meta">
                    <span v-if="issue.estimatedHours" class="hours">
                      {{ issue.estimatedHours }}h
                    </span>
                    <a-tooltip v-if="issue.dueAt" :title="formatDate(issue.dueAt)">
                      <CalendarOutlined class="due-icon" />
                    </a-tooltip>
                  </div>
                </div>
              </div>

              <div class="add-card" @click="createIssue(column)">
                <PlusOutlined />
                <span>添加事项</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 看板配置模态框 -->
    <a-modal
      v-model:open="configModalVisible"
      title="看板配置"
      width="80%"
      :footer="null"
    >
      <a-tabs v-model:activeKey="activeConfigTab">
        <a-tab-pane key="boards" tab="看板管理">
          <BoardManagement 
            :project-id="projectId" 
            @board-created="handleBoardCreated"
            @board-updated="handleBoardUpdated"
          />
        </a-tab-pane>
        <a-tab-pane v-if="selectedBoardId" key="columns" tab="列管理">
          <ColumnManagement 
            :board-id="selectedBoardId"
            :project-id="projectId"
            @column-updated="handleColumnUpdated"
          />
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { ReloadOutlined, PlusOutlined, CalendarOutlined, EllipsisOutlined, SearchOutlined } from '@ant-design/icons-vue';
import http from '../api/http';
import { useLoading } from '../composables/useLoading';
import BoardManagement from '../components/BoardManagement.vue';
import ColumnManagement from '../components/ColumnManagement.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const { loading, withLoading } = useLoading();

// 数据状态
const boards = ref<any[]>([]);
const selectedBoardId = ref<string>('');
const kanbanData = ref<any>(null);

// 拖拽状态
const draggedIssue = ref<any>(null);
const draggedFromColumn = ref<any>(null);
const dragOverColumn = ref<any>(null);

// 配置模态框状态
const configModalVisible = ref(false);
const activeConfigTab = ref('boards');

// 搜索状态
const searchText = ref('');
const filteredKanbanData = ref<any>(null);
const searchTimeout = ref<number | null>(null);

// 加载看板列表
async function loadBoards() {
  try {
    const res = await http.get(`/projects/${projectId}/boards`);
    boards.value = res.data.data || [];
    
    // 如果有看板且没有选中，选择第一个
    if (boards.value.length > 0 && !selectedBoardId.value) {
      selectedBoardId.value = boards.value[0].id;
      await loadKanbanData();
    }
  } catch (e: any) {
    console.error('Load boards error:', e);
    if (e.response?.status === 404) {
      message.warning('该项目暂无看板，请先创建看板');
    } else {
      message.error('加载看板列表失败：' + (e.response?.data?.message || e.message));
    }
  }
}

// 加载看板数据
async function loadKanbanData() {
  if (!selectedBoardId.value) return;
  
  await withLoading(async () => {
    try {
      const res = await http.get(`/projects/${projectId}/boards/${selectedBoardId.value}/kanban`);
      kanbanData.value = res.data.data;
      filterIssues();
    } catch (e: any) {
      console.error('Load kanban data error:', e);
      if (e.response?.status === 404) {
        message.warning('看板不存在或已被删除');
        selectedBoardId.value = '';
      } else {
        message.error('加载看板数据失败：' + (e.response?.data?.message || e.message));
      }
    }
  });
}

// 防抖搜索
function debouncedSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  searchTimeout.value = window.setTimeout(() => {
    filterIssues();
  }, 300);
}

// 过滤事项
function filterIssues() {
  if (!kanbanData.value || !searchText.value.trim()) {
    filteredKanbanData.value = kanbanData.value;
    return;
  }

  const searchTerm = searchText.value.toLowerCase();
  const filteredColumns = kanbanData.value.columns.map((column: any) => ({
    ...column,
    issues: column.issues?.filter((issue: any) => 
      issue.title.toLowerCase().includes(searchTerm) ||
      issue.description?.toLowerCase().includes(searchTerm) ||
      issue.assigneeName?.toLowerCase().includes(searchTerm)
    ) || []
  }));

  filteredKanbanData.value = {
    ...kanbanData.value,
    columns: filteredColumns
  };
}

// 刷新看板
async function refreshKanban() {
  await loadKanbanData();
}

// 跳转到新列表页
function toListByType(type: string) {
  const base = `/projects/${projectId}`;
  if (type === 'requirement') return router.push(`${base}/requirements`);
  if (type === 'bug') return router.push(`${base}/bugs`);
  return router.push(`${base}/tasks`);
}

// 查看事项（跳转到对应列表）
function viewIssue(issue: any) {
  toListByType(issue.type);
}

// 创建事项（跳转到任务列表）
function createIssue(_column: any) {
  router.push(`/projects/${projectId}/tasks`);
}

// 获取类型颜色
function getTypeColor(type: string) {
  const colors = {
    task: 'blue',
    requirement: 'green',
    bug: 'red'
  };
  return colors[type as keyof typeof colors] || 'default';
}

// 获取类型名称
function getTypeName(type: string) {
  const names = {
    task: '任务',
    requirement: '需求',
    bug: '缺陷'
  };
  return names[type as keyof typeof names] || type;
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

// 拖拽处理函数
function handleDragStart(event: DragEvent, issue: any) {
  draggedIssue.value = issue;
  draggedFromColumn.value = kanbanData.value?.columns?.find((col: any) => 
    col.issues?.some((i: any) => i.id === issue.id)
  );
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', issue.id);
  }
}

function handleDragEnd() {
  draggedIssue.value = null;
  draggedFromColumn.value = null;
  dragOverColumn.value = null;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  const columnElement = target.closest('.kanban-column');
  if (columnElement) {
    const columnId = columnElement.getAttribute('data-column-id');
    dragOverColumn.value = kanbanData.value?.columns?.find((col: any) => col.id === columnId);
  }
}

async function handleDrop(event: DragEvent, targetColumn: any) {
  event.preventDefault();
  
  if (!draggedIssue.value || !draggedFromColumn.value) {
    return;
  }

  // 如果拖拽到同一列，不做任何操作
  if (draggedFromColumn.value.id === targetColumn.id) {
    return;
  }

  // 检查WIP限制
  if (targetColumn.wipLimit && targetColumn.issues?.length >= targetColumn.wipLimit) {
    message.warning(`列"${targetColumn.name}"已达到WIP限制 (${targetColumn.wipLimit})`);
    return;
  }

  try {
    // 调用API移动事项
    await http.put(`/projects/${projectId}/boards/move-issue`, {
      issueId: draggedIssue.value.id,
      columnId: targetColumn.id
    });

    // 更新本地数据
    const issue = draggedIssue.value;
    
    // 从原列移除
    if (draggedFromColumn.value.issues) {
      const index = draggedFromColumn.value.issues.findIndex((i: any) => i.id === issue.id);
      if (index > -1) {
        draggedFromColumn.value.issues.splice(index, 1);
      }
    }
    
    // 添加到目标列
    if (targetColumn.issues) {
      targetColumn.issues.push(issue);
    } else {
      targetColumn.issues = [issue];
    }

    message.success(`事项已移动到"${targetColumn.name}"`);
  } catch (error) {
    message.error('移动事项失败');
    console.error('Move issue error:', error);
  }
}

// 显示看板配置
function showBoardConfig() {
  configModalVisible.value = true;
  activeConfigTab.value = 'boards';
}

// 选择第一个看板
function selectFirstBoard() {
  if (boards.value.length > 0) {
    selectedBoardId.value = boards.value[0].id;
    loadKanbanData();
  }
}

// 获取过滤后的事项总数
function getTotalFilteredIssues() {
  if (!filteredKanbanData.value) return 0;
  return filteredKanbanData.value.columns?.reduce((total: number, column: any) => 
    total + (column.issues?.length || 0), 0) || 0;
}

// 清除搜索
function clearSearch() {
  searchText.value = '';
  filterIssues();
}

// 处理看板创建
function handleBoardCreated() {
  loadBoards();
  message.success('看板创建成功');
}

// 处理看板更新
function handleBoardUpdated() {
  loadBoards();
  message.success('看板更新成功');
}

// 处理列更新
function handleColumnUpdated() {
  loadKanbanData();
  message.success('列更新成功');
}

// WIP限制相关函数
function getWipColor(column: any) {
  if (!column.wipLimit) return 'blue';
  const current = column.issues?.length || 0;
  const limit = column.wipLimit;
  
  if (current >= limit) return 'red';
  if (current >= limit * 0.8) return 'orange';
  return 'green';
}

function getWipStatusColor(column: any) {
  const current = column.issues?.length || 0;
  const limit = column.wipLimit;
  
  if (current >= limit) return 'red';
  if (current >= limit * 0.8) return 'orange';
  return 'green';
}

function getWipStatus(column: any) {
  const current = column.issues?.length || 0;
  const limit = column.wipLimit;
  
  if (current >= limit) return '已满';
  if (current >= limit * 0.8) return '接近限制';
  return '正常';
}

// 事项操作处理
function handleIssueAction(action: string, issue: any) {
  switch (action) {
    case 'view':
      viewIssue(issue);
      break;
  }
}

// 键盘快捷键
function handleKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + K 聚焦搜索框
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    const searchInput = document.querySelector('input[placeholder="搜索事项..."]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  // Escape 清除搜索
  if (event.key === 'Escape' && searchText.value) {
    clearSearch();
  }
}

onMounted(() => {
  loadBoards();
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown);
});

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
});
</script>

<style scoped>
.kanban-container {
  height: calc(100vh - 120px);
  overflow: hidden;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.loading-content {
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.search-results-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae7ff;
  border-radius: 6px;
  margin-bottom: 16px;
}

.kanban-board {
  height: calc(100vh - 200px);
  overflow-x: auto;
  overflow-y: hidden;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  height: 100%;
  min-width: fit-content;
  padding: 16px 0;
}

.kanban-column {
  min-width: 300px;
  max-width: 300px;
  background: #fafafa;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: white;
  border-radius: 8px 8px 0 0;
}

.column-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.column-name {
  font-weight: 600;
  font-size: 14px;
}

.column-stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

.column-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
  transition: all 0.2s;
}

.column-content.drag-over {
  background-color: #f0f9ff;
  border: 2px dashed #1890ff;
  border-radius: 6px;
  transform: scale(1.02);
  transition: all 0.3s ease;
}

.kanban-column.drag-over {
  border-color: #1890ff !important;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
  transform: scale(1.01);
  transition: all 0.3s ease;
}

.kanban-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  cursor: grab;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.kanban-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg) scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.2s ease;
}

.kanban-card.drag-over {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.issue-id {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.card-title {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
  color: #333;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignee {
  display: flex;
  align-items: center;
  gap: 4px;
}

.no-assignee {
  font-size: 12px;
  color: #999;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hours {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.due-icon {
  color: #ff4d4f;
  font-size: 12px;
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.add-card:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 搜索高亮 */
.kanban-card.highlighted {
  background-color: #fff7e6;
  border-color: #ffa940;
}

/* 空状态样式 */
.column-content:empty::after {
  content: "拖拽事项到这里";
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 12px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  margin: 8px 0;
}

/* 骨架屏样式 */
.kanban-skeleton {
  display: flex;
  gap: 16px;
  height: 100%;
  min-width: fit-content;
  padding: 16px 0;
}

.skeleton-column {
  min-width: 300px;
  max-width: 300px;
  background: #fafafa;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.skeleton-header {
  height: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px 8px 0 0;
  margin: 12px 16px;
}

.skeleton-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card {
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 8px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .kanban-columns {
    flex-direction: column;
  }
  
  .kanban-column {
    min-width: 100%;
    max-width: 100%;
  }

  .kanban-skeleton {
    flex-direction: column;
  }

  .skeleton-column {
    min-width: 100%;
    max-width: 100%;
  }
}
</style>