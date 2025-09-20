/**
 * GitLab映射表格逻辑 Composable
 */
import { ref, computed, watch } from 'vue';
import type { MappingItem, ProjectItem, InstanceItem } from '@/components/GitLabIntegration/types/mappings.types';
import { useMappingsFilters } from './useMappingsFilters';
import { useMappingsPagination } from './useMappingsPagination';

export function useMappingsTable(
  mappings: Ref<MappingItem[]>,
  projects: Ref<ProjectItem[]>,
  instances: Ref<InstanceItem[]>
) {
  // 表格加载状态
  const tableLoading = ref(false);

  // 使用筛选逻辑
  const filters = useMappingsFilters(mappings, projects, instances);

  // 使用分页逻辑
  const pagination = useMappingsPagination();

  // 分页后的数据
  const paginatedMappings = computed(() => {
    const { current, pageSize } = pagination.pagination.value;
    const start = (current - 1) * pageSize;
    const end = start + pageSize;
    return filters.filteredMappings.value.slice(start, end);
  });

  // 更新分页总数
  watch(
    () => filters.filteredMappings.value.length,
    (newLength) => {
      pagination.updateTotal(newLength);
    },
    { immediate: true }
  );

  // 筛选变化时重置到第一页
  watch(
    [filters.searchText, filters.projectFilter, filters.instanceFilter, filters.statusFilter],
    () => {
      pagination.resetToFirstPage();
    }
  );

  // 刷新表格
  const refreshTable = () => {
    tableLoading.value = true;
    // 这里可以添加刷新逻辑
    setTimeout(() => {
      tableLoading.value = false;
    }, 300);
  };

  // 重置表格
  const resetTable = () => {
    filters.resetFilters();
    pagination.resetPagination();
  };

  return {
    // 响应式状态
    tableLoading,
    
    // 计算属性
    filteredMappings: filters.filteredMappings,
    paginatedMappings,
    
    // 筛选相关
    searchText: filters.searchText,
    projectFilter: filters.projectFilter,
    instanceFilter: filters.instanceFilter,
    statusFilter: filters.statusFilter,
    
    // 分页相关
    pagination: pagination.pagination,
    
    // 方法
    handleSearch: filters.handleSearch,
    handleFilter: filters.handleFilter,
    handleTableChange: pagination.handleTableChange,
    refreshTable,
    resetTable,
    resetFilters: filters.resetFilters,
  };
}

// 导入Vue类型
import type { Ref, ComputedRef } from 'vue';

