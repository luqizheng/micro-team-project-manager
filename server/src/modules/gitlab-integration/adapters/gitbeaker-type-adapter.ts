import {
  GitLabProject,
  GitLabUser,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabPipeline,
  GitLabCommit,
} from '../interfaces/gitlab-api.interface';

/**
 * GitBeaker 类型适配器
 * 将 @gitbeaker/rest 返回的类型转换为项目内部使用的接口类型
 */
export class GitBeakerTypeAdapter {
  /**
   * 转换用户类型
   */
  static adaptUser(gitbeakerUser: any): GitLabUser {
    return {
      id: gitbeakerUser.id,
      name: gitbeakerUser.name,
      username: gitbeakerUser.username,
      email: gitbeakerUser.email || gitbeakerUser.public_email || '',
      avatar_url: gitbeakerUser.avatar_url,
      web_url: gitbeakerUser.web_url,
      created_at: gitbeakerUser.created_at,
      state: gitbeakerUser.state as 'active' | 'blocked',
      is_admin: gitbeakerUser.is_admin,
      last_activity_on: gitbeakerUser.last_activity_on,
    };
  }

  /**
   * 转换项目类型
   */
  static adaptProject(gitbeakerProject: any): GitLabProject {
    return {
      id: gitbeakerProject.id,
      name: gitbeakerProject.name,
      name_with_namespace: gitbeakerProject.name_with_namespace,
      path: gitbeakerProject.path,
      path_with_namespace: gitbeakerProject.path_with_namespace,
      description: gitbeakerProject.description,
      visibility: gitbeakerProject.visibility as 'private' | 'internal' | 'public',
      web_url: gitbeakerProject.web_url,
      created_at: gitbeakerProject.created_at,
      updated_at: gitbeakerProject.updated_at,
      default_branch: gitbeakerProject.default_branch,
      owner: gitbeakerProject.owner ? {
        id: gitbeakerProject.owner.id,
        name: gitbeakerProject.owner.name,
        username: gitbeakerProject.owner.username,
        email: gitbeakerProject.owner.email || '',
      } : undefined,
      namespace: {
        id: gitbeakerProject.namespace?.id || 0,
        name: gitbeakerProject.namespace?.name || '',
        path: gitbeakerProject.namespace?.path || '',
        kind: gitbeakerProject.namespace?.kind || 'group',
      },
    };
  }

  /**
   * 转换 Issue 类型
   */
  static adaptIssue(gitbeakerIssue: any): GitLabIssue {
    return {
      id: gitbeakerIssue.id,
      iid: gitbeakerIssue.iid,
      title: gitbeakerIssue.title,
      description: gitbeakerIssue.description,
      state: gitbeakerIssue.state as 'opened' | 'closed',
      created_at: gitbeakerIssue.created_at,
      updated_at: gitbeakerIssue.updated_at,
      closed_at: gitbeakerIssue.closed_at,
      labels: gitbeakerIssue.labels || [],
      assignees: (gitbeakerIssue.assignees || []).map((assignee: any) => this.adaptUser(assignee)),
      author: this.adaptUser(gitbeakerIssue.author),
      web_url: gitbeakerIssue.web_url,
      project_id: gitbeakerIssue.project_id,
      milestone: gitbeakerIssue.milestone ? {
        id: gitbeakerIssue.milestone.id,
        title: gitbeakerIssue.milestone.title,
        description: gitbeakerIssue.milestone.description,
        state: gitbeakerIssue.milestone.state as 'active' | 'closed',
        created_at: gitbeakerIssue.milestone.created_at,
        updated_at: gitbeakerIssue.milestone.updated_at,
        due_date: gitbeakerIssue.milestone.due_date,
      } : undefined,
      weight: gitbeakerIssue.weight,
      epic: gitbeakerIssue.epic ? {
        id: gitbeakerIssue.epic.id,
        title: gitbeakerIssue.epic.title,
        url: gitbeakerIssue.epic.url,
      } : undefined,
    };
  }

  /**
   * 转换 Merge Request 类型
   */
  static adaptMergeRequest(gitbeakerMR: any): GitLabMergeRequest {
    return {
      id: gitbeakerMR.id,
      iid: gitbeakerMR.iid,
      title: gitbeakerMR.title,
      description: gitbeakerMR.description,
      state: gitbeakerMR.state as 'opened' | 'closed' | 'merged',
      created_at: gitbeakerMR.created_at,
      updated_at: gitbeakerMR.updated_at,
      merged_at: gitbeakerMR.merged_at,
      closed_at: gitbeakerMR.closed_at,
      source_branch: gitbeakerMR.source_branch,
      target_branch: gitbeakerMR.target_branch,
      author: this.adaptUser(gitbeakerMR.author),
      assignee: gitbeakerMR.assignee ? this.adaptUser(gitbeakerMR.assignee) : undefined,
      assignees: (gitbeakerMR.assignees || []).map((assignee: any) => this.adaptUser(assignee)),
      reviewers: (gitbeakerMR.reviewers || []).map((reviewer: any) => this.adaptUser(reviewer)),
      web_url: gitbeakerMR.web_url,
      project_id: gitbeakerMR.project_id,
      source_project_id: gitbeakerMR.source_project_id,
      target_project_id: gitbeakerMR.target_project_id,
      merge_status: gitbeakerMR.merge_status as 'can_be_merged' | 'cannot_be_merged' | 'unchecked',
      merge_when_pipeline_succeeds: gitbeakerMR.merge_when_pipeline_succeeds,
      work_in_progress: gitbeakerMR.work_in_progress,
      draft: gitbeakerMR.draft,
      labels: gitbeakerMR.labels || [],
      milestone: gitbeakerMR.milestone ? {
        id: gitbeakerMR.milestone.id,
        title: gitbeakerMR.milestone.title,
        description: gitbeakerMR.milestone.description,
        state: gitbeakerMR.milestone.state as 'active' | 'closed',
        created_at: gitbeakerMR.milestone.created_at,
        updated_at: gitbeakerMR.milestone.updated_at,
        due_date: gitbeakerMR.milestone.due_date,
      } : undefined,
    };
  }

  /**
   * 转换 Pipeline 类型
   */
  static adaptPipeline(gitbeakerPipeline: any): GitLabPipeline {
    return {
      id: gitbeakerPipeline.id,
      iid: gitbeakerPipeline.iid,
      project_id: gitbeakerPipeline.project_id,
      sha: gitbeakerPipeline.sha,
      ref: gitbeakerPipeline.ref,
      status: gitbeakerPipeline.status as 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual',
      created_at: gitbeakerPipeline.created_at,
      updated_at: gitbeakerPipeline.updated_at,
      web_url: gitbeakerPipeline.web_url,
      before_sha: gitbeakerPipeline.before_sha,
      tag: gitbeakerPipeline.tag,
      yaml_errors: gitbeakerPipeline.yaml_errors,
      user: this.adaptUser(gitbeakerPipeline.user),
      started_at: gitbeakerPipeline.started_at,
      finished_at: gitbeakerPipeline.finished_at,
      committed_at: gitbeakerPipeline.committed_at,
      duration: gitbeakerPipeline.duration,
      queued_duration: gitbeakerPipeline.queued_duration,
      coverage: gitbeakerPipeline.coverage,
      stages: gitbeakerPipeline.stages || [],
      jobs: (gitbeakerPipeline.jobs || []).map((job: any) => this.adaptJob(job)),
    };
  }

  /**
   * 转换 Job 类型
   */
  static adaptJob(gitbeakerJob: any): any {
    return {
      id: gitbeakerJob.id,
      status: gitbeakerJob.status as 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual',
      stage: gitbeakerJob.stage,
      name: gitbeakerJob.name,
      ref: gitbeakerJob.ref,
      tag: gitbeakerJob.tag,
      coverage: gitbeakerJob.coverage,
      allow_failure: gitbeakerJob.allow_failure,
      created_at: gitbeakerJob.created_at,
      started_at: gitbeakerJob.started_at,
      finished_at: gitbeakerJob.finished_at,
      erased_at: gitbeakerJob.erased_at,
      duration: gitbeakerJob.duration,
      queued_duration: gitbeakerJob.queued_duration,
      user: this.adaptUser(gitbeakerJob.user),
      commit: {
        id: gitbeakerJob.commit?.id,
        sha: gitbeakerJob.commit?.sha,
        message: gitbeakerJob.commit?.message,
        author_name: gitbeakerJob.commit?.author_name,
        author_email: gitbeakerJob.commit?.author_email,
        created_at: gitbeakerJob.commit?.created_at,
      },
      web_url: gitbeakerJob.web_url,
      project: {
        id: gitbeakerJob.project?.id,
        name: gitbeakerJob.project?.name,
        path_with_namespace: gitbeakerJob.project?.path_with_namespace,
      },
    };
  }

  /**
   * 转换 Commit 类型
   */
  static adaptCommit(gitbeakerCommit: any): GitLabCommit {
    return {
      id: gitbeakerCommit.id,
      short_id: gitbeakerCommit.short_id,
      title: gitbeakerCommit.title,
      message: gitbeakerCommit.message,
      author_name: gitbeakerCommit.author_name,
      author_email: gitbeakerCommit.author_email,
      authored_date: gitbeakerCommit.authored_date,
      committer_name: gitbeakerCommit.committer_name,
      committer_email: gitbeakerCommit.committer_email,
      committed_date: gitbeakerCommit.committed_date,
      created_at: gitbeakerCommit.created_at,
      web_url: gitbeakerCommit.web_url,
      stats: {
        additions: gitbeakerCommit.stats?.additions || 0,
        deletions: gitbeakerCommit.stats?.deletions || 0,
        total: gitbeakerCommit.stats?.total || 0,
      },
      status: gitbeakerCommit.status as 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual',
    };
  }

  /**
   * 批量转换用户数组
   */
  static adaptUsers(gitbeakerUsers: any[]): GitLabUser[] {
    return gitbeakerUsers.map(user => this.adaptUser(user));
  }

  /**
   * 批量转换项目数组
   */
  static adaptProjects(gitbeakerProjects: any[]): GitLabProject[] {
    return gitbeakerProjects.map(project => this.adaptProject(project));
  }

  /**
   * 批量转换 Issue 数组
   */
  static adaptIssues(gitbeakerIssues: any[]): GitLabIssue[] {
    return gitbeakerIssues.map(issue => this.adaptIssue(issue));
  }

  /**
   * 批量转换 Merge Request 数组
   */
  static adaptMergeRequests(gitbeakerMRs: any[]): GitLabMergeRequest[] {
    return gitbeakerMRs.map(mr => this.adaptMergeRequest(mr));
  }

  /**
   * 批量转换 Pipeline 数组
   */
  static adaptPipelines(gitbeakerPipelines: any[]): GitLabPipeline[] {
    return gitbeakerPipelines.map(pipeline => this.adaptPipeline(pipeline));
  }

  /**
   * 批量转换 Commit 数组
   */
  static adaptCommits(gitbeakerCommits: any[]): GitLabCommit[] {
    return gitbeakerCommits.map(commit => this.adaptCommit(commit));
  }
}
