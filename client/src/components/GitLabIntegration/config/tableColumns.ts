/**
 * GitLab映射表格列配置
 */
import type { TableColumn } from '../types/mappings.types';

export const MAPPINGS_TABLE_COLUMNS: TableColumn[] = [
  {
    title: 'PM项目信息',
    key: 'project',
    width: 250,
  },
  {
    title: 'GitLab分组',
    key: 'gitlabGroup',
    width: 200,
  },
  {
    title: 'GitLab实例',
    key: 'instance',
    width: 150,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '最后同步',
    key: 'lastSyncAt',
    width: 180,
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
  },
];

// 默认分页配置
export const DEFAULT_PAGINATION_CONFIG = {
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
};

