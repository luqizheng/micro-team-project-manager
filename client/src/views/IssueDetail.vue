<template>
  <a-card :title="`事项 #${issue.id} - ${issue.title}`" :bordered="false">
    <a-row :gutter="16">
      <a-col :span="16">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="类型">{{ issue.type }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStateColor(issue.state)">{{ issue.state }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(issue.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ formatDate(issue.updatedAt) }}</a-descriptions-item>
          <a-descriptions-item v-if="issue.type === 'task'" label="预估工时">{{ issue.estimatedHours || '-' }} 小时</a-descriptions-item>
          <a-descriptions-item v-if="issue.type === 'task'" label="实际工时">{{ issue.actualHours || '-' }} 小时</a-descriptions-item>
        </a-descriptions>

        <a-divider>状态变更</a-divider>
        <a-space>
          <a-button 
            v-for="state in availableStates" 
            :key="state" 
            :type="state === issue.state ? 'primary' : 'default'"
            @click="changeState(state)"
          >
            {{ state }}
          </a-button>
        </a-space>

        <a-divider>评论</a-divider>
        <a-list :data-source="comments" item-layout="vertical">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-comment>
                <template #author>{{ item.user?.name || item.user?.email }}</template>
                <template #datetime>{{ formatDate(item.createdAt) }}</template>
                <template #content>
                  <p>{{ item.content }}</p>
                </template>
              </a-comment>
            </a-list-item>
          </template>
        </a-list>

        <a-divider>添加评论</a-divider>
        <a-form :model="commentForm" @submit.prevent>
          <a-form-item>
            <a-textarea v-model:value="commentForm.content" placeholder="输入评论内容" :rows="3" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="addComment" :loading="commentLoading">添加评论</a-button>
          </a-form-item>
        </a-form>
      </a-col>

      <a-col :span="8">
        <a-card title="附件" size="small">
          <a-upload
            :file-list="fileList"
            :before-upload="beforeUpload"
            :custom-request="customUpload"
            :show-upload-list="true"
          >
            <a-button>
              <upload-outlined />
              上传附件
            </a-button>
          </a-upload>

          <a-list 
            :data-source="attachments" 
            size="small" 
            style="margin-top: 16px"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a :href="item.url" target="_blank">{{ item.fileName }}</a>
                  </template>
                  <template #description>
                    {{ formatFileSize(item.size) }} - {{ formatDate(item.createdAt) }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </a-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import http from '../api/http';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;
const issueId = route.params.issueId as string;

const issue = ref<any>({});
const comments = ref<any[]>([]);
const attachments = ref<any[]>([]);
const fileList = ref<any[]>([]);
const commentLoading = ref(false);
const commentForm = reactive({ content: '' });

const availableStates = ['open', 'in_progress', 'resolved', 'closed'];

function getStateColor(state: string) {
  const colors: Record<string, string> = {
    open: 'blue',
    in_progress: 'orange',
    resolved: 'green',
    closed: 'red'
  };
  return colors[state] || 'default';
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function loadIssue() {
  try {
    const res = await http.get(`/projects/${projectId}/issues/${issueId}`);
    issue.value = res.data.data;
  } catch (e: any) {
    message.error(e?.response?.data?.message || '加载失败');
  }
}

async function loadComments() {
  try {
    const res = await http.get(`/projects/${projectId}/issues/${issueId}/comments`);
    comments.value = res.data.data || [];
  } catch (e: any) {
    message.error('加载评论失败');
  }
}

async function loadAttachments() {
  try {
    const res = await http.get(`/projects/${projectId}/issues/${issueId}/attachments`);
    attachments.value = res.data.data || [];
  } catch (e: any) {
    message.error('加载附件失败');
  }
}

async function changeState(newState: string) {
  try {
    await http.patch(`/projects/${projectId}/issues/${issueId}/state`, { state: newState });
    issue.value.state = newState;
    message.success('状态更新成功');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '状态更新失败');
  }
}

async function addComment() {
  if (!commentForm.content.trim()) {
    message.warning('请输入评论内容');
    return;
  }
  commentLoading.value = true;
  try {
    await http.post(`/projects/${projectId}/issues/${issueId}/comments`, { content: commentForm.content });
    commentForm.content = '';
    await loadComments();
    message.success('评论添加成功');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '评论添加失败');
  } finally {
    commentLoading.value = false;
  }
}

function beforeUpload(file: any) {
  const isValidSize = file.size / 1024 / 1024 < 10; // 10MB
  if (!isValidSize) {
    message.error('文件大小不能超过 10MB');
    return false;
  }
  return true;
}

async function customUpload(options: any) {
  const { file } = options;
  try {
    // 获取预签名上传URL
    const res = await http.post(`/projects/${projectId}/issues/${issueId}/attachments/presigned`, {
      fileName: file.name,
      contentType: file.type,
      size: file.size
    });
    
    const { uploadUrl, objectKey } = res.data.data;
    
    // 上传文件到MinIO
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    
    if (!uploadRes.ok) {
      throw new Error('上传失败');
    }
    
    // 记录附件信息
    await http.post(`/projects/${projectId}/issues/${issueId}/attachments`, {
      objectKey,
      fileName: file.name,
      size: file.size,
      contentType: file.type
    });
    
    message.success('附件上传成功');
    await loadAttachments();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '附件上传失败');
  }
}

onMounted(async () => {
  await Promise.all([loadIssue(), loadComments(), loadAttachments()]);
});
</script>
