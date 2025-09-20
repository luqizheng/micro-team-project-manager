/**
 * GitLab映射相关类型定义
 */

// 基础项目信息
export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  avatar?: string;
  visibility: 'public' | 'private';
  archived: boolean;
  description?: string;
}

// GitLab实例信息
export interface InstanceItem {
  id: string;
  name: string;
  avatar?: string;
  baseUrl: string;
  type: 'self_hosted' | 'gitlab_com';
  isActive: boolean;
}

// 映射项目信息
export interface MappingItem {
  id: string;
  projectId: string;
  gitlabInstanceId: string;
  gitlabGroupId: string;
  gitlabGroupPath: string;
  groupName?: string;
  isActive: boolean;
  lastSyncAt?: string;
  updatedAt: string;
  createdAt: string;
  description?: string;
  // 关联数据
  project?: ProjectItem;
  gitlabInstance?: InstanceItem;
}

// 筛选条件
export interface FilterConditions {
  searchText: string;
  projectFilter: string;
  instanceFilter: string;
  statusFilter: string;
}

// 分页配置
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger: boolean;
  showQuickJumper: boolean;
  showTotal: (total: number) => string;
}

// 表格列配置
export interface TableColumn {
  title: string;
  key: string;
  width?: number;
  fixed?: 'left' | 'right';
  sorter?: boolean;
  filters?: Array<{ text: string; value: string }>;
}

// 组件Props
export interface GitLabMappingsTabProps {
  mappings: MappingItem[];
  projects: ProjectItem[];
  instances: InstanceItem[];
  loading: boolean;
}

// 组件Emits
export interface GitLabMappingsTabEmits {
  refresh: [];
  create: [];
  edit: [mapping: MappingItem];
  delete: [mapping: MappingItem];
  sync: [mapping: MappingItem];
}

// 单元格Props
export interface CellProps {
  record: MappingItem;
  column: TableColumn;
}

// 操作按钮Props
export interface ActionsProps {
  record: MappingItem;
  syncingMappings: string[];
}

// Composables返回类型
export interface UseMappingsFiltersReturn {
  searchText: Ref<string>;
  projectFilter: Ref<string>;
  instanceFilter: Ref<string>;
  statusFilter: Ref<string>;
  handleSearch: () => void;
  handleFilter: () => void;
  resetFilters: () => void;
}

export interface UseMappingsPaginationReturn {
  pagination: Ref<PaginationConfig>;
  handleTableChange: (pag: any) => void;
  resetPagination: () => void;
}

export interface UseMappingsTableReturn {
  filteredMappings: ComputedRef<MappingItem[]>;
  tableLoading: Ref<boolean>;
  refreshTable: () => void;
}

// 导入Vue类型
import type { Ref, ComputedRef } from 'vue';
