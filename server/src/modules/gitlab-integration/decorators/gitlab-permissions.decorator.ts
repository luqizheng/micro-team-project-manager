import { SetMetadata } from '@nestjs/common';

/**
 * GitLab集成权限装饰�?
 * 用于定义GitLab集成功能所需的权�?
 */
export const GITLAB_PERMISSIONS_KEY = 'gitlab_permissions';

export interface GitLabPermission {
  action: string;
  resource: string;
  scope?: 'instance' | 'project' | 'global';
  conditions?: string[];
}

/**
 * GitLab集成权限装饰�?
 * @param permissions 权限列表
 */
export const GitLabPermissions = (...permissions: GitLabPermission[]) =>
  SetMetadata(GITLAB_PERMISSIONS_KEY, permissions);

/**
 * 预定义的GitLab集成权限
 */
export const GitLabPermissionsList = {
  // 实例管理权限
  INSTANCE_CREATE: {
    action: 'create',
    resource: 'gitlab_instance',
    scope: 'global',
  } as GitLabPermission,
  
  INSTANCE_READ: {
    action: 'read',
    resource: 'gitlab_instance',
    scope: 'global',
  } as GitLabPermission,
  
  INSTANCE_UPDATE: {
    action: 'update',
    resource: 'gitlab_instance',
    scope: 'instance',
  } as GitLabPermission,
  
  INSTANCE_DELETE: {
    action: 'delete',
    resource: 'gitlab_instance',
    scope: 'instance',
  } as GitLabPermission,
  
  INSTANCE_TEST: {
    action: 'test',
    resource: 'gitlab_instance',
    scope: 'instance',
  } as GitLabPermission,

  // 项目映射权限
  PROJECT_MAPPING_CREATE: {
    action: 'create',
    resource: 'gitlab_project_mapping',
    scope: 'project',
  } as GitLabPermission,
  
  PROJECT_MAPPING_READ: {
    action: 'read',
    resource: 'gitlab_project_mapping',
    scope: 'project',
  } as GitLabPermission,
  
  PROJECT_MAPPING_UPDATE: {
    action: 'update',
    resource: 'gitlab_project_mapping',
    scope: 'project',
  } as GitLabPermission,
  
  PROJECT_MAPPING_DELETE: {
    action: 'delete',
    resource: 'gitlab_project_mapping',
    scope: 'project',
  } as GitLabPermission,
  
  PROJECT_MAPPING_SYNC: {
    action: 'sync',
    resource: 'gitlab_project_mapping',
    scope: 'project',
  } as GitLabPermission,

  // 同步管理权限
  SYNC_INCREMENTAL: {
    action: 'sync',
    resource: 'gitlab_sync',
    scope: 'instance',
    conditions: ['incremental'],
  } as GitLabPermission,
  
  SYNC_FULL: {
    action: 'sync',
    resource: 'gitlab_sync',
    scope: 'instance',
    conditions: ['full'],
  } as GitLabPermission,
  
  SYNC_COMPENSATION: {
    action: 'sync',
    resource: 'gitlab_sync',
    scope: 'instance',
    conditions: ['compensation'],
  } as GitLabPermission,

  // 用户同步权限
  USER_SYNC: {
    action: 'sync',
    resource: 'gitlab_user',
    scope: 'instance',
  } as GitLabPermission,
  
  USER_MAPPING_READ: {
    action: 'read',
    resource: 'gitlab_user_mapping',
    scope: 'instance',
  } as GitLabPermission,
  
  USER_MAPPING_CLEANUP: {
    action: 'cleanup',
    resource: 'gitlab_user_mapping',
    scope: 'instance',
  } as GitLabPermission,

  // 事件管理权限
  EVENT_READ: {
    action: 'read',
    resource: 'gitlab_event',
    scope: 'global',
  } as GitLabPermission,
  
  EVENT_RETRY: {
    action: 'retry',
    resource: 'gitlab_event',
    scope: 'global',
  } as GitLabPermission,
  
  EVENT_BATCH_RETRY: {
    action: 'batch_retry',
    resource: 'gitlab_event',
    scope: 'global',
  } as GitLabPermission,

  // 统计和监控权�?
  STATISTICS_READ: {
    action: 'read',
    resource: 'gitlab_statistics',
    scope: 'global',
  } as GitLabPermission,
  
  HEALTH_CHECK: {
    action: 'read',
    resource: 'gitlab_health',
    scope: 'global',
  } as GitLabPermission,

  // Webhook权限
  WEBHOOK_RECEIVE: {
    action: 'receive',
    resource: 'gitlab_webhook',
    scope: 'instance',
  } as GitLabPermission,
  
  WEBHOOK_READ: {
    action: 'read',
    resource: 'gitlab_webhook',
    scope: 'instance',
  } as GitLabPermission,
};

/**
 * 角色权限映射
 */
export const RolePermissions = {
  system_admin: [
    // 系统管理员拥有所有权�?
    ...Object.values(GitLabPermissionsList),
  ],
  
  project_manager: [
    // 项目管理员权�?
    GitLabPermissionsList.PROJECT_MAPPING_CREATE,
    GitLabPermissionsList.PROJECT_MAPPING_READ,
    GitLabPermissionsList.PROJECT_MAPPING_UPDATE,
    GitLabPermissionsList.PROJECT_MAPPING_DELETE,
    GitLabPermissionsList.PROJECT_MAPPING_SYNC,
    GitLabPermissionsList.STATISTICS_READ,
    GitLabPermissionsList.HEALTH_CHECK,
    GitLabPermissionsList.WEBHOOK_READ,
  ],
  
  user: [
    // 普通用户权�?
    GitLabPermissionsList.STATISTICS_READ,
    GitLabPermissionsList.HEALTH_CHECK,
  ],
};

/**
 * 检查用户是否具有指定权�?
 */
export function hasPermission(
  userRole: string,
  permission: GitLabPermission,
  context?: { instanceId?: string; projectId?: string },
): boolean {
  const rolePermissions = (RolePermissions as any)[userRole] || [];
  
  // 检查是否有匹配的权�?
  const hasMatchingPermission = rolePermissions.some((rolePermission: any) => 
    rolePermission.action === permission.action &&
    rolePermission.resource === permission.resource &&
    rolePermission.scope === permission.scope
  );

  if (!hasMatchingPermission) {
    return false;
  }

  // 检查条�?
  if (permission.conditions && permission.conditions.length > 0) {
    // 这里可以添加更复杂的条件检查逻辑
    // 例如检查用户是否是特定项目的管理员�?
    return true; // 简化实�?
  }

  return true;
}

/**
 * 检查用户是否具有指定权限（简化版本）
 */
export function hasSimplePermission(
  userRole: string,
  action: string,
  resource: string,
  scope: 'instance' | 'project' | 'global' = 'global',
): boolean {
  const permission: GitLabPermission = {
    action,
    resource,
    scope,
  };
  
  return hasPermission(userRole, permission);
}
