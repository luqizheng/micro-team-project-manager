<template>
  <a-layout style="min-height:100vh">
    <a-layout-header style="display: flex; justify-content: space-between; align-items: center;">
      <div style="color:#fff;font-weight:600">项目管理工具</div>
      <div v-if="auth.user" style="color:#fff">
        <a-space>
          <a-avatar :size="24" :src="auth.user.avatar" style="margin-right: 8px">
            {{ (auth.user.displayName || auth.user.name)?.charAt(0)?.toUpperCase() }}
          </a-avatar>
          <span>{{ auth.user.displayName || auth.user.name || auth.user.email }}</span>
          <a-button type="link" style="color:#fff" @click="logout">退出</a-button>
        </a-space>
      </div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider v-if="auth.user" width="200" style="background: #fff">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          style="height: 100%"
          @click="handleMenuClick"
        >
          <a-menu-item key="/projects">
            <template #icon>
              <FolderOutlined />
            </template>
            项目管理
          </a-menu-item>
          <a-menu-item key="/profile">
            <template #icon>
              <UserOutlined />
            </template>
            个人资料
          </a-menu-item>
          <a-menu-item v-if="canManageUsers" key="/users">
            <template #icon>
              <TeamOutlined />
            </template>
            用户管理
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout-content style="padding:24px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { FolderOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const selectedKeys = ref<string[]>([]);

const canManageUsers = computed(() => auth.hasAnyRole(['admin', 'project_admin']));

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
  } else if (path === '/profile') {
    selectedKeys.value = ['/profile'];
  } else if (path.startsWith('/users')) {
    selectedKeys.value = ['/users'];
  } else {
    selectedKeys.value = [];
  }
}

function handleMenuClick({ key }: { key: string }) {
  router.push(key);
}

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<style>
html,body,#app { height: 100%; margin: 0; }
</style>


