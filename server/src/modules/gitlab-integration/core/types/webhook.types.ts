/**
 * GitLab Webhook相关类型定义
 */

/**
 * GitLab Webhook事件基础接口
 */
export interface GitLabWebhookEvent {
  /** 事件类型 */
  event_type: string;
  /** 项目信息 */
  project: {
    id: number;
    name: string;
    description: string;
    web_url: string;
    git_http_url: string;
    git_ssh_url: string;
    namespace: string;
    visibility_level: number;
    path_with_namespace: string;
    default_branch: string;
    homepage: string;
    url: string;
    ssh_url: string;
    http_url: string;
  };
  /** 用户信息 */
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar_url: string;
  };
  /** 对象类型 */
  object_kind: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 其他属�?*/
  [key: string]: any;
}

/**
 * Issue Webhook事件
 */
export interface GitLabIssueEvent extends GitLabWebhookEvent {
  object_kind: 'issue';
  object_attributes: {
    id: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    closed_at?: string;
    labels: Array<{
      id: number;
      title: string;
      color: string;
      project_id: number;
      created_at: string;
      updated_at: string;
      template: boolean;
      description: string;
      type: string;
      group_id: number;
    }>;
    assignee_ids: number[];
    assignee_id?: number;
    author_id: number;
    due_date?: string;
    milestone_id?: number;
    iid: number;
    url: string;
    action: 'open' | 'close' | 'reopen' | 'update';
  };
}

/**
 * Merge Request Webhook事件
 */
export interface GitLabMergeRequestEvent extends GitLabWebhookEvent {
  object_kind: 'merge_request';
  object_attributes: {
    id: number;
    iid: number;
    title: string;
    description: string;
    state: string;
    created_at: string;
    updated_at: string;
    target_branch: string;
    source_branch: string;
    author_id: number;
    assignee_id?: number;
    assignee_ids: number[];
    source_project_id: number;
    target_project_id: number;
    labels: Array<{
      id: number;
      title: string;
      color: string;
      project_id: number;
      created_at: string;
      updated_at: string;
      template: boolean;
      description: string;
      type: string;
      group_id: number;
    }>;
    work_in_progress: boolean;
    milestone_id?: number;
    merge_when_pipeline_succeeds: boolean;
    merge_status: string;
    sha: string;
    merge_commit_sha?: string;
    squash_commit_sha?: string;
    url: string;
    action: 'open' | 'close' | 'reopen' | 'update' | 'approved' | 'unapproved' | 'approval' | 'unapproval' | 'merge';
  };
}

/**
 * Push Webhook事件
 */
export interface GitLabPushEvent extends GitLabWebhookEvent {
  object_kind: 'push';
  before: string;
  after: string;
  ref: string;
  checkout_sha: string;
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    modified: string[];
    removed: string[];
  }>;
  total_commits_count: number;
}

/**
 * Pipeline Webhook事件
 */
export interface GitLabPipelineEvent extends GitLabWebhookEvent {
  object_kind: 'pipeline';
  object_attributes: {
    id: number;
    ref: string;
    tag: boolean;
    sha: string;
    before_sha: string;
    source: string;
    status: string;
    stages: string[];
    created_at: string;
    finished_at?: string;
    duration?: number;
    queued_duration?: number;
    variables: Array<{
      key: string;
      value: string;
    }>;
  };
}

/**
 * Note Webhook事件
 */
export interface GitLabNoteEvent extends GitLabWebhookEvent {
  object_kind: 'note';
  object_attributes: {
    id: number;
    note: string;
    noteable_type: string;
    author_id: number;
    created_at: string;
    updated_at: string;
    project_id: number;
    attachment?: string;
    line_code?: string;
    commit_id?: string;
    noteable_id: number;
    system: boolean;
    st_diff?: {
      diff: string;
      new_path: string;
      old_path: string;
      a_mode: string;
      b_mode: string;
      new_file: boolean;
      renamed_file: boolean;
      deleted_file: boolean;
    };
    url: string;
  };
}

/**
 * Webhook处理结果
 */
export interface WebhookHandleResult {
  success: boolean;
  message: string;
  eventId?: string;
  processedAt: Date;
}
