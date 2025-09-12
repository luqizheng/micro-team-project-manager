<template>
  <a-card title="个人资料" :bordered="false">
    <a-row :gutter="24">
      <!-- 左侧：头像和基本信息 -->
      <a-col :span="8">
        <a-card title="头像" size="small" style="margin-bottom: 16px">
          <div class="avatar-section">
            <a-avatar :size="120" :src="profileForm.avatar" style="margin-bottom: 16px">
              {{ (profileForm.displayName || profileForm.name)?.charAt(0)?.toUpperCase() }}
            </a-avatar>
            <div>
              <a-upload
                :before-upload="handleAvatarUpload"
                :show-upload-list="false"
                accept="image/*"
              >
                <a-button type="primary" ghost>
                  <template #icon>
                    <UploadOutlined />
                  </template>
                  更换头像
                </a-button>
              </a-upload>
            </div>
          </div>
        </a-card>

        <a-card title="基本信息" size="small">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="用户ID">
              {{ profileForm.id }}
            </a-descriptions-item>
            <a-descriptions-item label="注册时间">
              {{ formatDate(profileForm.createdAt) }}
            </a-descriptions-item>
            <a-descriptions-item label="最后更新">
              {{ formatDate(profileForm.updatedAt) }}
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="profileForm.status === 'active' ? 'green' : 'red'">
                {{ profileForm.status === 'active' ? '活跃' : '禁用' }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 右侧：编辑表单 -->
      <a-col :span="16">
        <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
          <!-- 基本信息 -->
          <a-tab-pane key="basic" tab="基本信息">
            <a-form
              :model="profileForm"
              :label-col="{ span: 6 }"
              :wrapper-col="{ span: 18 }"
              @finish="updateProfile"
            >
              <a-form-item label="姓名" required>
                <a-input v-model:value="profileForm.name" placeholder="请输入姓名" />
              </a-form-item>

              <a-form-item label="显示名称">
                <a-input v-model:value="profileForm.displayName" placeholder="请输入显示名称（可选）" />
                <div class="form-help">显示名称用于在系统中更友好的显示，如不填写则使用姓名</div>
              </a-form-item>

              <a-form-item label="邮箱" required>
                <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
              </a-form-item>

              <a-form-item label="头像URL">
                <a-input v-model:value="profileForm.avatar" placeholder="请输入头像URL（可选）" />
                <div class="form-help">可以输入图片URL作为头像，或使用上方的上传功能</div>
              </a-form-item>

              <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
                <a-space>
                  <a-button type="primary" html-type="submit" :loading="profileLoading">
                    保存基本信息
                  </a-button>
                  <a-button @click="resetProfileForm">重置</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </a-tab-pane>

          <!-- 修改密码 -->
          <a-tab-pane key="password" tab="修改密码">
            <a-form
              :model="passwordForm"
              :label-col="{ span: 6 }"
              :wrapper-col="{ span: 18 }"
              @finish="updatePassword"
            >
              <a-form-item label="当前密码" required>
                <a-input-password v-model:value="passwordForm.currentPassword" placeholder="请输入当前密码" />
              </a-form-item>

              <a-form-item label="新密码" required>
                <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码（至少6位）" />
              </a-form-item>

              <a-form-item label="确认新密码" required>
                <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
              </a-form-item>

              <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
                <a-space>
                  <a-button type="primary" html-type="submit" :loading="passwordLoading">
                    修改密码
                  </a-button>
                  <a-button @click="resetPasswordForm">重置</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-col>
    </a-row>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import http from '../api/http';
import { message } from 'ant-design-vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

// 响应式数据
const activeTab = ref('basic');
const profileLoading = ref(false);
const passwordLoading = ref(false);

// 个人资料表单
const profileForm = reactive({
  id: '',
  name: '',
  displayName: '',
  email: '',
  avatar: '',
  status: 'active',
  createdAt: '',
  updatedAt: ''
});

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 加载个人资料
async function loadProfile() {
  try {
    const res = await http.get('/auth/profile');
    Object.assign(profileForm, res.data.data);
  } catch (e: any) {
    message.error('加载个人资料失败');
    console.error('Load profile error:', e);
  }
}

// 更新个人资料
async function updateProfile() {
  profileLoading.value = true;
  try {
    await http.patch('/auth/profile', {
      name: profileForm.name,
      displayName: profileForm.displayName,
      email: profileForm.email,
      avatar: profileForm.avatar
    });
    message.success('个人资料更新成功');
    
    // 更新本地存储的用户信息
    auth.updateUserInfo({
      name: profileForm.name,
      displayName: profileForm.displayName,
      email: profileForm.email,
      avatar: profileForm.avatar
    });
  } catch (e: any) {
    message.error(e?.response?.data?.message || '更新个人资料失败');
  } finally {
    profileLoading.value = false;
  }
}

// 修改密码
async function updatePassword() {
  if (!passwordForm.currentPassword) {
    message.error('请输入当前密码');
    return;
  }
  
  if (!passwordForm.newPassword) {
    message.error('请输入新密码');
    return;
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次输入的新密码不一致');
    return;
  }
  
  if (passwordForm.newPassword.length < 6) {
    message.error('新密码长度至少6位');
    return;
  }

  passwordLoading.value = true;
  try {
    await http.patch('/auth/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    message.success('密码修改成功');
    resetPasswordForm();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '密码修改失败');
  } finally {
    passwordLoading.value = false;
  }
}

// 处理头像上传
function handleAvatarUpload(file: File) {
  // 这里可以实现头像上传到服务器的逻辑
  // 暂时只是预览
  const reader = new FileReader();
  reader.onload = (e) => {
    profileForm.avatar = e.target?.result as string;
  };
  reader.readAsDataURL(file);
  
  message.info('头像上传功能待实现，当前仅预览');
  return false; // 阻止默认上传行为
}

// 重置个人资料表单
function resetProfileForm() {
  loadProfile();
}

// 重置密码表单
function resetPasswordForm() {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
}

// 标签页切换
function handleTabChange(key: string) {
  activeTab.value = key;
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN');
}

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.avatar-section {
  text-align: center;
}

.form-help {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.ant-descriptions-item-label {
  font-weight: 500;
}
</style>
