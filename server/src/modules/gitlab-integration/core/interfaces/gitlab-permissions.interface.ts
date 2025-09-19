/**
 * GitLab权限服务接口
 * 定义GitLab权限管理功能的核心业务接�?
 */

/**
 * GitLab权限用例服务接口
 * 负责GitLab权限管理的业务逻辑
 */
export interface IGitLabPermissionsUseCase {
  /**
   * 检查实例权�?
   * @param instanceId 实例ID
   * @param userId 用户ID
   * @returns 是否有权�?
   */
  checkInstancePermissions(instanceId: string, userId: string): Promise<boolean>;

  /**
   * 检查项目权�?
   * @param projectId 项目ID
   * @param userId 用户ID
   * @returns 是否有权�?
   */
  checkProjectPermissions(projectId: string, userId: string): Promise<boolean>;

  /**
   * 授予实例访问权限
   * @param instanceId 实例ID
   * @param userId 用户ID
   */
  grantInstanceAccess(instanceId: string, userId: string): Promise<void>;

  /**
   * 撤销实例访问权限
   * @param instanceId 实例ID
   * @param userId 用户ID
   */
  revokeInstanceAccess(instanceId: string, userId: string): Promise<void>;

  /**
   * 授予项目访问权限
   * @param projectId 项目ID
   * @param userId 用户ID
   */
  grantProjectAccess(projectId: string, userId: string): Promise<void>;

  /**
   * 撤销项目访问权限
   * @param projectId 项目ID
   * @param userId 用户ID
   */
  revokeProjectAccess(projectId: string, userId: string): Promise<void>;

  /**
   * 获取用户权限列表
   * @param userId 用户ID
   * @returns 权限列表
   */
  getUserPermissions(userId: string): Promise<PermissionInfo[]>;

  /**
   * 获取实例权限列表
   * @param instanceId 实例ID
   * @returns 权限列表
   */
  getInstancePermissions(instanceId: string): Promise<PermissionInfo[]>;
}

/**
 * 权限信息接口
 */
export interface PermissionInfo {
  /** 权限ID */
  id: string;
  /** 权限类型 */
  type: 'instance' | 'project';
  /** 资源ID */
  resourceId: string;
  /** 用户ID */
  userId: string;
  /** 权限级别 */
  level: 'read' | 'write' | 'admin';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}
