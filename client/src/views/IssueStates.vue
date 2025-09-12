<template>
  <a-card title="状态管理" :bordered="false">
    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="requirement" tab="需求状态">
        <StateConfigPanel 
          :project-id="projectId"
          issue-type="requirement"
          @state-changed="handleStateChanged"
        />
      </a-tab-pane>
      <a-tab-pane key="task" tab="任务状态">
        <StateConfigPanel 
          :project-id="projectId"
          issue-type="task"
          @state-changed="handleStateChanged"
        />
      </a-tab-pane>
      <a-tab-pane key="bug" tab="缺陷状态">
        <StateConfigPanel 
          :project-id="projectId"
          issue-type="bug"
          @state-changed="handleStateChanged"
        />
      </a-tab-pane>
    </a-tabs>
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import StateConfigPanel from '../components/StateConfigPanel.vue';

const route = useRoute();
const projectId = route.params.projectId as string;

const activeTab = ref('requirement');

function handleTabChange(key: string) {
  activeTab.value = key;
}

function handleStateChanged() {
  // 状态变更后的处理
  console.log('状态配置已更新');
}
</script>

<style scoped>
.ant-card {
  margin: 16px;
}
</style>