/**
 * GitLab映射分页逻辑 Composable
 */
import { ref, watch } from 'vue';
import type { PaginationConfig } from '@/components/GitLabIntegration/types/mappings.types';
import { DEFAULT_PAGINATION_CONFIG } from '@/components/GitLabIntegration/config/tableColumns';

export function useMappingsPagination() {
  // 分页配置
  const pagination = ref<PaginationConfig>({ ...DEFAULT_PAGINATION_CONFIG });

  // 分页事件处理
  const handleTableChange = (pag: any) => {
    pagination.value = { ...pagination.value, ...pag };
  };

  // 重置分页
  const resetPagination = () => {
    pagination.value = { ...DEFAULT_PAGINATION_CONFIG };
  };

  // 更新总数
  const updateTotal = (total: number) => {
    pagination.value.total = total;
  };

  // 重置到第一页
  const resetToFirstPage = () => {
    pagination.value.current = 1;
  };

  // 监听分页变化，重置到第一页
  const watchForReset = (callback: () => void) => {
    watch(
      () => pagination.value.current,
      (newPage, oldPage) => {
        if (newPage === 1 && oldPage !== 1) {
          callback();
        }
      }
    );
  };

  return {
    // 响应式状态
    pagination,
    
    // 方法
    handleTableChange,
    resetPagination,
    updateTotal,
    resetToFirstPage,
    watchForReset,
  };
}

// 导入Vue类型
import type { Ref } from 'vue';

