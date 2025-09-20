/**
 * GitLab映射筛选逻辑 Composable
 */
import { ref, computed } from 'vue';
import type { MappingItem, ProjectItem, InstanceItem, FilterConditions } from '@/components/GitLabIntegration/types/mappings.types';

export function useMappingsFilters(
  mappings: Ref<MappingItem[]>,
  projects: Ref<ProjectItem[]>,
  instances: Ref<InstanceItem[]>
) {
  // 筛选条件
  const searchText = ref('');
  const projectFilter = ref('');
  const instanceFilter = ref('');
  const statusFilter = ref('');

  // 筛选后的数据
  const filteredMappings = computed(() => {
    let filtered = mappings.value;

    // 搜索筛选
    if (searchText.value) {
      const search = searchText.value.toLowerCase();
      filtered = filtered.filter(mapping =>
        mapping.project?.name.toLowerCase().includes(search) ||
        mapping.project?.key.toLowerCase().includes(search) ||
        mapping.gitlabGroupPath.toLowerCase().includes(search) ||
        mapping.groupName?.toLowerCase().includes(search)
      );
    }

    // 项目筛选
    if (projectFilter.value) {
      filtered = filtered.filter(mapping => mapping.projectId === projectFilter.value);
    }

    // 实例筛选
    if (instanceFilter.value) {
      filtered = filtered.filter(mapping => mapping.gitlabInstanceId === instanceFilter.value);
    }

    // 状态筛选
    if (statusFilter.value) {
      filtered = filtered.filter(mapping => {
        if (statusFilter.value === 'active') {
          return mapping.isActive;
        } else if (statusFilter.value === 'inactive') {
          return !mapping.isActive;
        }
        return true;
      });
    }

    return filtered;
  });

  // 筛选方法
  const handleSearch = () => {
    // 搜索时重置到第一页
    // 这个逻辑会在分页composable中处理
  };

  const handleFilter = () => {
    // 筛选时重置到第一页
    // 这个逻辑会在分页composable中处理
  };

  const resetFilters = () => {
    searchText.value = '';
    projectFilter.value = '';
    instanceFilter.value = '';
    statusFilter.value = '';
  };

  // 获取当前筛选条件
  const getFilterConditions = (): FilterConditions => ({
    searchText: searchText.value,
    projectFilter: projectFilter.value,
    instanceFilter: instanceFilter.value,
    statusFilter: statusFilter.value,
  });

  return {
    // 响应式状态
    searchText,
    projectFilter,
    instanceFilter,
    statusFilter,
    
    // 计算属性
    filteredMappings,
    
    // 方法
    handleSearch,
    handleFilter,
    resetFilters,
    getFilterConditions,
  };
}

// 导入Vue类型
import type { Ref } from 'vue';

