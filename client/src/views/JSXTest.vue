<template>
  <div class="jsx-test-page">
    <a-card title="JSX 支持测试" :bordered="false">
      <a-tabs>
        <a-tab-pane key="example" tab="基础示例">
          <JSXExample />
        </a-tab-pane>
        <a-tab-pane key="project" tab="项目卡片">
          <div class="project-cards">
            <ProjectCard
              v-for="project in projects"
              :key="project.id"
              :project="project"
              @view="handleViewProject"
              @edit="handleEditProject"
              @delete="handleDeleteProject"
              @archive="handleArchiveProject"
            />
          </div>
        </a-tab-pane>
        <a-tab-pane key="kanban" tab="看板组件">
          <KanbanBoard
            :columns="kanbanColumns"
            :loading="kanbanLoading"
            @refresh="handleRefreshKanban"
            @configure="handleConfigureKanban"
            @create-issue="handleCreateIssue"
            @view-issue="handleViewIssue"
            @edit-issue="handleEditIssue"
            @duplicate-issue="handleDuplicateIssue"
            @move-issue="handleMoveIssue"
          />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import JSXExample from '../components/JSXExample';
import ProjectCard from '../components/ProjectCard';
import KanbanBoard from '../components/KanbanBoard';

// 项目数据
const projects = ref([
  {
    id: '1',
    name: '项目管理工具',
    key: 'PM',
    description: '一个现代化的项目管理平台',
    visibility: 'public' as const,
    memberCount: 5,
    createdAt: '2024-01-01',
    archived: false
  },
  {
    id: '2',
    name: '电商系统',
    key: 'EC',
    description: '完整的电商解决方案',
    visibility: 'private' as const,
    memberCount: 12,
    createdAt: '2024-01-15',
    archived: false
  },
  {
    id: '3',
    name: '移动应用',
    key: 'MA',
    description: '跨平台移动应用开发',
    visibility: 'public' as const,
    memberCount: 8,
    createdAt: '2024-02-01',
    archived: true
  }
]);

// 看板数据
const kanbanColumns = ref([
  {
    id: '1',
    name: '待办',
    color: '#1890ff',
    wipLimit: 5,
    issues: [
      {
        id: '1',
        title: '设计用户界面',
        description: '完成登录页面的UI设计',
        type: 'task',
        priority: 'high',
        assigneeName: '张三',
        estimatedHours: 8,
        state: 'todo'
      },
      {
        id: '2',
        title: '修复登录bug',
        description: '修复用户无法登录的问题',
        type: 'bug',
        priority: 'urgent',
        assigneeName: '李四',
        estimatedHours: 4,
        state: 'todo'
      }
    ]
  },
  {
    id: '2',
    name: '进行中',
    color: '#52c41a',
    wipLimit: 3,
    issues: [
      {
        id: '3',
        title: '开发API接口',
        description: '实现用户管理相关API',
        type: 'feature',
        priority: 'medium',
        assigneeName: '王五',
        estimatedHours: 16,
        state: 'in-progress'
      }
    ]
  },
  {
    id: '3',
    name: '已完成',
    color: '#722ed1',
    issues: [
      {
        id: '4',
        title: '项目初始化',
        description: '搭建项目基础架构',
        type: 'task',
        priority: 'low',
        assigneeName: '赵六',
        estimatedHours: 12,
        state: 'done'
      }
    ]
  }
]);

const kanbanLoading = ref(false);

// 项目操作处理
const handleViewProject = (project: any) => {
  message.info(`查看项目: ${project.name}`);
};

const handleEditProject = (project: any) => {
  message.info(`编辑项目: ${project.name}`);
};

const handleDeleteProject = (project: any) => {
  message.warning(`删除项目: ${project.name}`);
};

const handleArchiveProject = (project: any) => {
  message.info(`${project.archived ? '取消归档' : '归档'}项目: ${project.name}`);
};

// 看板操作处理
const handleRefreshKanban = () => {
  kanbanLoading.value = true;
  setTimeout(() => {
    kanbanLoading.value = false;
    message.success('看板已刷新');
  }, 1000);
};

const handleConfigureKanban = () => {
  message.info('打开看板配置');
};

const handleCreateIssue = (columnId: string) => {
  message.info(`在列 ${columnId} 中创建事项`);
};

const handleViewIssue = (issue: any) => {
  message.info(`查看事项: ${issue.title}`);
};

const handleEditIssue = (issue: any) => {
  message.info(`编辑事项: ${issue.title}`);
};

const handleDuplicateIssue = (issue: any) => {
  message.info(`复制事项: ${issue.title}`);
};

const handleMoveIssue = (issueId: string, columnId: string) => {
  message.success(`事项 ${issueId} 已移动到列 ${columnId}`);
};

onMounted(() => {
  message.success('JSX 支持已启用！');
});
</script>

<style scoped>
.jsx-test-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.project-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

:deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.ant-tabs-content-holder) {
  padding: 16px 0;
}
</style>
