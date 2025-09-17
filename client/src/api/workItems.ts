import http from './http'

export interface WorkItemPayload {
  projectId: string
  type: 'task' | 'bug'
  title: string
  description?: string
  state: string
  priority?: string
  severity?: string
  assigneeId?: string
  reporterId?: string
  requirementId?: string
  subsystemId?: string
  featureModuleId?: string
  storyPoints?: number
  estimateMinutes?: number
  remainingMinutes?: number
  estimatedHours?: number | null
  actualHours?: number | null
  sprintId?: string
  releaseId?: string
  parentId?: string
  labels?: string[]
  dueAt?: string
}

export interface WorkItemQuery {
  projectId?: string
  page?: number
  pageSize?: number
  q?: string
  state?: string
  type?: 'task' | 'bug'
  assigneeId?: string
  priority?: string
}

export function listWorkItems(params: WorkItemQuery) {
  return http.get('/work-items', { params })
}

export function getWorkItem(id: string) {
  return http.get(`/work-items/${id}`)
}

export function createWorkItem(payload: WorkItemPayload) {
  return http.post('/work-items', payload)
}

export function updateWorkItem(id: string, payload: Partial<WorkItemPayload>) {
  return http.put(`/work-items/${id}`, payload)
}

export function deleteWorkItem(id: string) {
  return http.delete(`/work-items/${id}`)
}


