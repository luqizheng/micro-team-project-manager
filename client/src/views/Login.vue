<template>
  <div class="login-page">
    <div class="login-background">
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>
    
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <div class="logo-icon">
              <ProjectOutlined />
            </div>
            <div class="logo-text">
              <h1>项目管理工具</h1>
              <p>Project Manager</p>
            </div>
          </div>
        </div>
        
        <div class="login-form-container">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">请登录您的账户</p>
          
          <a-form :model="form" @submit.prevent="submit" class="login-form">
            <a-form-item name="email" class="form-item">
              <a-input
                v-model:value="form.email"
                placeholder="请输入邮箱地址"
                :disabled="loading"
                @pressEnter="submit"
                size="large"
                class="form-input"
              >
                <template #prefix>
                  <MailOutlined class="input-icon" />
                </template>
              </a-input>
            </a-form-item>
            
            <a-form-item name="password" class="form-item">
              <a-input-password
                v-model:value="form.password"
                placeholder="请输入密码"
                :disabled="loading"
                @pressEnter="submit"
                size="large"
                class="form-input"
              >
                <template #prefix>
                  <LockOutlined class="input-icon" />
                </template>
              </a-input-password>
            </a-form-item>
            
            <a-form-item class="form-item">
              <a-button
                type="primary"
                block
                :loading="loading"
                :disabled="loading"
                @click="submit"
                size="large"
                class="login-btn"
              >
                <template v-if="!loading">
                  <LoginOutlined />
                </template>
                {{ loading ? '登录中...' : '登录' }}
              </a-button>
            </a-form-item>
          </a-form>
        </div>
        
        <div class="login-footer">
          <p class="footer-text">
            还没有账户？ 
            <a href="#" class="register-link">立即注册</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import http from '../api/http';
import { useAuthStore } from '../stores/auth';
import { 
  ProjectOutlined, 
  MailOutlined, 
  LockOutlined, 
  LoginOutlined 
} from '@ant-design/icons-vue';

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

<style scoped>
/* 登录页面容器 */
.login-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 背景装饰 */
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.bg-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 20%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  bottom: 30%;
  right: 25%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 登录容器 */
.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideInUp 0.8s ease-out;
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.logo-text h1 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.logo-text p {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

/* 表单容器 */
.login-form-container {
  margin-bottom: 24px;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin: 0 0 32px 0;
}

/* 登录表单 */
.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 24px;
}

.form-input {
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  font-size: 16px;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-icon {
  color: #999;
  font-size: 16px;
}

.login-btn {
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

/* 登录底部 */
.login-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.footer-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #764ba2;
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-card {
    padding: 24px;
  }
  
  .logo-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }
  
  .logo-text h1 {
    font-size: 20px;
  }
  
  .form-title {
    font-size: 18px;
  }
}

/* 加载状态 */
.login-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

/* 输入框聚焦效果 */
.form-input:focus + .input-icon {
  color: #667eea;
}

/* 表单验证样式 */
:deep(.ant-form-item-has-error .form-input) {
  border-color: #ff4d4f;
}

:deep(.ant-form-item-has-error .form-input:focus) {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
}
</style>
