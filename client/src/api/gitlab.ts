import http  from './http';

/**
 * GitLab集成API服务
 */
export class GitLabApiService {
  // 实例管理
  static async getInstances() {
    return http.get('/gitlab/instances');
  }

  static async getInstance(id: string) {
    return http.get(`/gitlab/instances/${id}`);
  }

  static async createInstance(data: any) {
    return http.post('/gitlab/instances', data);
  }

  static async updateInstance(id: string, data: any) {
    return http.put(`/gitlab/instances/${id}`, data);
  }

  static async deleteInstance(id: string) {
    return http.delete(`/gitlab/instances/${id}`);
  }

  static async testInstance(id: string) {
    return http.post(`/gitlab/instances/${id}/test`);
  }

  static async getInstanceProjects(instanceId: string) {
    return http.get(`/gitlab/instances/${instanceId}/projects`);
  }

  // 项目映射管理
  static async getProjectMappings(projectId: string) {
    return http.get(`/gitlab/projects/${projectId}/mappings`);
  }

  static async getProjectMapping(projectId: string, mappingId: string) {
    return http.get(`/gitlab/projects/${projectId}/mappings/${mappingId}`);
  }

  static async createProjectMapping(projectId: string, data: any) {
    return http.post(`/gitlab/projects/${projectId}/mappings`, data);
  }

  static async updateProjectMapping(projectId: string, mappingId: string, data: any) {
    return http.put(`/gitlab/projects/${projectId}/mappings/${mappingId}`, data);
  }

  static async deleteProjectMapping(projectId: string, mappingId: string) {
    return http.delete(`/gitlab/projects/${projectId}/mappings/${mappingId}`);
  }

  static async syncProjectMapping(projectId: string, mappingId: string) {
    return http.post(`/gitlab/projects/${projectId}/mappings/${mappingId}/sync`);
  }

  // 同步管理
  static async performIncrementalSync(instanceId: string, projectId?: string) {
    return http.post(`/gitlab/sync/incremental/${instanceId}`, { projectId });
  }

  static async performFullSync(instanceId: string, projectId?: string) {
    return http.post(`/gitlab/sync/full/${instanceId}`, { projectId });
  }

  static async performCompensationSync(instanceId: string, projectId?: string) {
    return http.post(`/gitlab/sync/compensation/${instanceId}`, { projectId });
  }

  // 用户同步管理
  static async syncUsers(instanceId: string) {
    return http.post(`/gitlab/sync/users/${instanceId}`);
  }

  static async getUserMappingStatistics(instanceId: string) {
    return http.get(`/gitlab/sync/users/${instanceId}/statistics`);
  }

  static async cleanupInvalidMappings(instanceId: string) {
    return http.post(`/gitlab/sync/users/${instanceId}/cleanup`);
  }

  // 事件管理
  static async getEventStatistics() {
    return http.get('/gitlab/sync/events/statistics');
  }

  static async retryEvent(eventId: string) {
    return http.post(`/gitlab/sync/events/${eventId}/retry`);
  }

  static async batchRetryEvents(eventIds: string[]) {
    return http.post('/gitlab/sync/events/batch-retry', { eventIds });
  }

  static async getEventHealthStatus() {
    return http.get('/gitlab/sync/events/health');
  }

  // 权限管理
  static async checkPermission(permission: string, context?: any) {
    return http.post('/gitlab/permissions/check', { permission, ...context });
  }

  static async getUserPermissionSummary(userId: string) {
    return http.get(`/gitlab/permissions/user/${userId}/summary`);
  }

  static async getMyPermissionSummary() {
    return http.get('/gitlab/permissions/my/summary');
  }

  static async getUserAccessibleInstances(userId: string) {
    return http.get(`/gitlab/permissions/user/${userId}/instances`);
  }

  static async getUserAccessibleMappings(userId: string) {
    return http.get(`/gitlab/permissions/user/${userId}/mappings`);
  }

  static async checkSyncPermission(userId: string, syncType: string, context: any) {
    return http.post(`/gitlab/permissions/user/${userId}/sync/check`, {
      syncType,
      ...context,
    });
  }

  static async getPermissionConfig() {
    return http.get('/gitlab/permissions/config');
  }

  static async updatePermissionConfig(config: any) {
    return http.put('/gitlab/permissions/config', config);
  }

  static async getRolePermissionMappings() {
    return http.get('/gitlab/permissions/roles');
  }

  // 统计和监控
  static async getStatistics() {
    return http.get('/gitlab/statistics');
  }

  // 获取所有项目映射
  static async getAllProjectMappings(instanceId?: string) {
    const url = instanceId ? `/gitlab/project-mappings?instanceId=${instanceId}` : '/gitlab/project-mappings';
    return http.get(url);
  }
}
