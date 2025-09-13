/**
 * GitLab API接口定义
 */

/**
 * GitLab项目信息接口
 */
export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  visibility: 'private' | 'internal' | 'public';
  web_url: string;
  created_at: string;
  updated_at: string;
  default_branch: string;
  owner?: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
  };
}

/**
 * GitLab用户信息接口
 */
export interface GitLabUser {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar_url?: string;
  web_url: string;
  created_at: string;
  state: 'active' | 'blocked';
  is_admin?: boolean;
  last_activity_on?: string;
}

/**
 * GitLab Issue信息接口
 */
export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: 'opened' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  labels: string[];
  assignees: GitLabUser[];
  author: GitLabUser;
  web_url: string;
  project_id: number;
  milestone?: {
    id: number;
    title: string;
    description?: string;
    state: 'active' | 'closed';
    created_at: string;
    updated_at: string;
    due_date?: string;
  };
  weight?: number;
  epic?: {
    id: number;
    title: string;
    url: string;
  };
}

/**
 * GitLab Merge Request信息接口
 */
export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: 'opened' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  source_branch: string;
  target_branch: string;
  author: GitLabUser;
  assignee?: GitLabUser;
  assignees: GitLabUser[];
  reviewers: GitLabUser[];
  web_url: string;
  project_id: number;
  source_project_id: number;
  target_project_id: number;
  merge_status: 'can_be_merged' | 'cannot_be_merged' | 'unchecked';
  merge_when_pipeline_succeeds: boolean;
  work_in_progress: boolean;
  draft: boolean;
  labels: string[];
  milestone?: {
    id: number;
    title: string;
    description?: string;
    state: 'active' | 'closed';
    created_at: string;
    updated_at: string;
    due_date?: string;
  };
}

/**
 * GitLab Pipeline信息接口
 */
export interface GitLabPipeline {
  id: number;
  iid: number;
  project_id: number;
  sha: string;
  ref: string;
  status: 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';
  created_at: string;
  updated_at: string;
  web_url: string;
  before_sha: string;
  tag: boolean;
  yaml_errors?: string;
  user: GitLabUser;
  started_at?: string;
  finished_at?: string;
  committed_at?: string;
  duration?: number;
  queued_duration?: number;
  coverage?: string;
  stages: string[];
  jobs: GitLabJob[];
}

/**
 * GitLab Job信息接口
 */
export interface GitLabJob {
  id: number;
  status: 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';
  stage: string;
  name: string;
  ref: string;
  tag: boolean;
  coverage?: string;
  allow_failure: boolean;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  erased_at?: string;
  duration?: number;
  queued_duration?: number;
  user: GitLabUser;
  commit: {
    id: string;
    sha: string;
    message: string;
    author_name: string;
    author_email: string;
    created_at: string;
  };
  web_url: string;
  project: {
    id: number;
    name: string;
    path_with_namespace: string;
  };
}

/**
 * GitLab Commit信息接口
 */
export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  web_url: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  status?: 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';
}

/**
 * GitLab Webhook事件接口
 */
export interface GitLabWebhookEvent {
  object_kind: string;
  event_type: string;
  action?: string;
  user: GitLabUser;
  project: GitLabProject;
  repository: {
    name: string;
    url: string;
    description?: string;
    homepage: string;
  };
  object_attributes: any;
  created_at: string;
  updated_at: string;
}

/**
 * GitLab Push事件接口
 */
export interface GitLabPushEvent extends GitLabWebhookEvent {
  object_kind: 'push';
  ref: string;
  before: string;
  after: string;
  commits: GitLabCommit[];
  total_commits_count: number;
}

/**
 * GitLab Merge Request事件接口
 */
export interface GitLabMergeRequestEvent extends GitLabWebhookEvent {
  object_kind: 'merge_request';
  object_attributes: GitLabMergeRequest;
  changes?: {
    title?: { previous: string; current: string };
    description?: { previous: string; current: string };
    state?: { previous: string; current: string };
    assignee_id?: { previous: number; current: number };
    assignee_ids?: { previous: number[]; current: number[] };
    reviewer_ids?: { previous: number[]; current: number[] };
    labels?: { previous: string[]; current: string[] };
  };
}

/**
 * GitLab Issue事件接口
 */
export interface GitLabIssueEvent extends GitLabWebhookEvent {
  object_kind: 'issue';
  object_attributes: GitLabIssue;
  changes?: {
    title?: { previous: string; current: string };
    description?: { previous: string; current: string };
    state?: { previous: string; current: string };
    assignee_id?: { previous: number; current: number };
    assignee_ids?: { previous: number[]; current: number[] };
    labels?: { previous: string[]; current: string[] };
  };
}

/**
 * GitLab Pipeline事件接口
 */
export interface GitLabPipelineEvent extends GitLabWebhookEvent {
  object_kind: 'pipeline';
  object_attributes: GitLabPipeline;
  changes?: {
    status?: { previous: string; current: string };
  };
}

/**
 * GitLab API响应接口
 */
export interface GitLabApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * GitLab API错误接口
 */
export interface GitLabApiError {
  message: string;
  error: string;
  error_description?: string;
  status: number;
}
