<template>
  <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
    <a-card title="登录" style="width:360px">
      <a-form :model="form" @submit.prevent="submit">
        <a-form-item label="邮箱" :label-col="{span:6}" :wrapper-col="{span:18}" required>
          <a-input v-model:value="form.email" placeholder="email" :disabled="loading" @pressEnter="submit" />
        </a-form-item>
        <a-form-item label="密码" :label-col="{span:6}" :wrapper-col="{span:18}" required>
          <a-input-password v-model:value="form.password" placeholder="password" :disabled="loading" @pressEnter="submit" />
        </a-form-item>
        <a-form-item :wrapper-col="{offset:6,span:18}">
          <a-button type="primary" block :loading="loading" :disabled="loading" @click="submit">登录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import http from '../api/http';
import { useAuthStore } from '../stores/auth';

const form = reactive({ email: '', password: '' });
const loading = ref(false);
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

onMounted(() => auth.loadFromStorage());

async function submit() {
  if (!form.email || !form.password) {
    message.error('请输入邮箱和密码');
    return;
  }
  loading.value = true;
  try {
    const res = await http.post('/auth/login', form);
    const { accessToken, user } = res.data.data || {};
    if (accessToken) {
      auth.setAuth(accessToken, user);
      const redirect = (route.query.redirect as string) || '/projects';
      router.replace(redirect);
    } else {
      message.error('登录失败');
    }
  } catch (e: any) {
    message.error(e?.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>


