<template>
  <a-layout style="min-height:100vh">
    <a-layout-header style="display: flex; justify-content: space-between; align-items: center;">
      <div style="color:#fff;font-weight:600">项目管理工具</div>
      <div v-if="auth.user" style="color:#fff">
        <a-space>
          <span>{{ auth.user.name || auth.user.email }}</span>
          <a-button type="link" style="color:#fff" @click="logout">退出</a-button>
        </a-space>
      </div>
    </a-layout-header>
    <a-layout-content style="padding:24px">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const auth = useAuthStore();

onMounted(() => {
  auth.loadFromStorage();
});

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<style>
html,body,#app { height: 100%; margin: 0; }
</style>


