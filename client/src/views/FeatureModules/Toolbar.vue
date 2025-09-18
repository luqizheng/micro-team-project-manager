<template>
  <a-space style="margin-bottom: 12px">
    <a-input
      :value="searchKeyword"
      placeholder="搜索功能模块名称"
      allow-clear
      style="width: 240px"
      @update:value="val => emit('update:searchKeyword', val)"
      @press-enter="emit('search')"
    />
    <a-select
      :value="stateFilter"
      placeholder="状态"
      allow-clear
      style="width: 140px"
      @update:value="val => emit('update:stateFilter', val)"
    >
      <a-select-option value="open">开放</a-select-option>
      <a-select-option value="in_progress">进行中</a-select-option>
      <a-select-option value="closed">已关闭</a-select-option>
    </a-select>
    <a-select
      v-if="false"
      :value="''"
      placeholder=""
      allow-clear
      style="width: 0"
      @update:value="() => {}"
    >
      
    </a-select>
    <a-button type="primary" @click="emit('search')">搜索</a-button>
    <a-button type="primary" @click="emit('create')">新建功能模块</a-button>
  </a-space>
</template>

<script setup lang="ts">
const props = defineProps<{
  searchKeyword: string;
  stateFilter: string;
}>();

const emit = defineEmits<{
  (e: 'update:searchKeyword', value: string): void;
  (e: 'update:stateFilter', value: string): void;
  (e: 'search'): void;
  (e: 'create'): void;
}>();
</script>


