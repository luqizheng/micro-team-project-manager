<template>
  <a-layout class="app-layout">
    <a-layout-header class="app-header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">
            <ProjectOutlined />
          </div>
          <div class="logo-text">
            <span class="logo-title">项目管理工具</span>
            <span class="logo-subtitle">Project Manager</span>
          </div>
        </div>
      </div>
      <div v-if="auth.user" class="header-right">
        <a-space size="middle">
          <a-badge :count="0" :offset="[10, 0]">
            <a-button type="text" class="notification-btn">
              <BellOutlined />
            </a-button>
          </a-badge>
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile" @click="goToProfile">
                  <UserOutlined />
                  个人资料
                </a-menu-item>
                <a-menu-item key="settings" @click="goToSettings">
                  <SettingOutlined />
                  设置
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="logout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
            <a-space class="user-info">
              <a-avatar :size="32" :src="auth.user.avatar" class="user-avatar">
                {{ (auth.user.displayName || auth.user.name)?.charAt(0)?.toUpperCase() }}
              </a-avatar>
              <div class="user-details">
                <div class="user-name">{{ auth.user.displayName || auth.user.name || auth.user.email }}</div>
                <div class="user-role">{{ getUserRole() }}</div>
              </div>
              <DownOutlined class="dropdown-icon" />
            </a-space>
          </a-dropdown>
        </a-space>
      </div>
    </a-layout-header>
    <a-layout class="main-layout">
      <a-layout-sider v-if="auth.user" class="app-sider" :width="240" :collapsed="collapsed" @collapse="onCollapse">
        <div class="sider-header">
          <a-button type="text" class="collapse-btn" @click="toggleCollapse">
            <MenuFoldOutlined v-if="!collapsed" />
            <MenuUnfoldOutlined v-else />
          </a-button>
        </div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          class="app-menu"
          :inline-collapsed="collapsed"
          @click="handleMenuClick"
        >
          <a-menu-item key="/projects" class="menu-item">
            <template #icon>
              <FolderOutlined class="menu-icon" />
            </template>
            <span class="menu-text">项目管理</span>
          </a-menu-item>
          <a-menu-item key="/my-tasks" class="menu-item">
            <template #icon>
              <CheckCircleOutlined class="menu-icon" />
            </template>
            <span class="menu-text">我的任务</span>
          </a-menu-item>
          <a-menu-item key="/profile" class="menu-item">
            <template #icon>
              <UserOutlined class="menu-icon" />
            </template>
            <span class="menu-text">个人资料</span>
          </a-menu-item>
          <a-menu-item v-if="canManageUsers" key="/users" class="menu-item">
            <template #icon>
              <TeamOutlined class="menu-icon" />
            </template>
            <span class="menu-text">用户管理</span>
          </a-menu-item>
          <a-menu-item v-if="canManageGitLab" key="/gitlab" class="menu-item">
            <template #icon>
              <GitlabOutlined class="menu-icon" />
            </template>
            <span class="menu-text">GitLab集成</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout-content class="app-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { 
  FolderOutlined, 
  UserOutlined, 
  TeamOutlined, 
  ProjectOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleOutlined,
  GitlabOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const selectedKeys = ref<string[]>([]);
const collapsed = ref(false);

const canManageUsers = computed(() => auth.hasAnyRole(['admin', 'project_manager']));
const canManageGitLab = computed(() => auth.hasAnyRole(['admin', 'project_manager']));

onMounted(() => {
  auth.loadFromStorage();
  updateSelectedKeys();
});

watch(() => route.path, () => {
  updateSelectedKeys();
});

function updateSelectedKeys() {
  const path = route.path;
  if (path.startsWith('/projects')) {
    selectedKeys.value = ['/projects'];
  } else if (path === '/my-tasks') {
    selectedKeys.value = ['/my-tasks'];
  } else if (path === '/profile') {
    selectedKeys.value = ['/profile'];
  } else if (path.startsWith('/users')) {
    selectedKeys.value = ['/users'];
  } else if (path.startsWith('/gitlab')) {
    selectedKeys.value = ['/gitlab'];
  } else {
    selectedKeys.value = [];
  }
}

function handleMenuClick({ key }: { key: string }) {
  router.push(key);
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

function onCollapse(collapsedValue: boolean) {
  collapsed.value = collapsedValue;
}

function getUserRole() {
  if (auth.hasRole('admin')) return '管理员';
  if (auth.hasRole('project_manager')) return '项目管理员';
  if (auth.hasRole('project_manager')) return '项目经理';
  if (auth.hasRole('member')) return '成员';
  return '用户';
}

function goToProfile() {
  router.push('/profile');
}

function goToSettings() {
  // 暂时跳转到个人资料页面
  router.push('/profile');
}

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
/* 全局样式重置 */
:global(html), :global(body), :global(#app) { 
  height: 100%; 
  margin: 0; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 主布局 */
.app-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 头部样式 */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-title {
  color: white;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.logo-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 400;
  line-height: 1;
}

.header-right {
  display: flex;
  align-items: center;
}

.notification-btn {
  color: white !important;
  font-size: 16px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: scale(1.1);
}

.user-info {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-role {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  line-height: 1;
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  transition: transform 0.3s ease;
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

/* 主布局 */
.main-layout {
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

/* 侧边栏样式 */
.app-sider {
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.sider-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
}

.collapse-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #667eea;
}

.collapse-btn:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

.app-menu {
  border: none;
  background: white;
  padding: 16px 0;
}

.menu-item {
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 44px;
  line-height: 44px;
}

.menu-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateX(4px);
}

.menu-item.ant-menu-item-selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.menu-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon {
  transform: scale(1.1);
}

.menu-text {
  font-weight: 500;
  transition: all 0.3s ease;
}

/* 内容区域 */
.app-content {
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.content-wrapper {
  padding: 24px;
  min-height: calc(100vh - 112px);
  background: transparent;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }
  
  .logo-text {
    display: none;
  }
  
  .user-details {
    display: none;
  }
  
  .app-sider {
    position: fixed;
    left: 0;
    top: 64px;
    height: calc(100vh - 64px);
    z-index: 999;
  }
  
  .content-wrapper {
    padding: 16px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-layout {
  animation: fadeInUp 0.6s ease-out;
}

/* 滚动条美化 */
:global(::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:global(::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

:global(::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: #a8a8a8;
}
</style>


