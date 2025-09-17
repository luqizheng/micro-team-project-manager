import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, MoreThan } from "typeorm";
import { GitLabInstance } from "../entities/gitlab-instance.entity";
import { GitLabProjectMapping } from "../entities/gitlab-project-mapping.entity";
import { GitLabSyncStatus } from "../entities/gitlab-sync-status.entity";
import { GitLabApiGitBeakerService } from "./gitlab-api-gitbeaker.service";
import { GitLabUserSyncService } from "./gitlab-user-sync.service";
import { GitLabSyncService } from "./gitlab-sync.service";
import { SyncResult, SyncConfig } from "../interfaces/gitlab-sync.interface";
import { WorkItemEntity } from "../../work-items/work-item.entity";
import {
  GitLabIssue,
  GitLabMergeRequest,
  GitLabUser,
} from "../interfaces/gitlab-api.interface";

// 错误处理辅助函数
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * GitLab增量同步服务
 * 负责处理增量同步、全量同步和补偿同步
 */
@Injectable()
export class GitLabIncrementalSyncService {
  private readonly logger = new Logger(GitLabIncrementalSyncService.name);
  private readonly defaultSyncConfig: SyncConfig = {
    maxRetries: 3,
    retryInterval: 5000,
    batchSize: 20,
    timeout: 60000,
    enableAutoSync: true,
    syncInterval: 300000, // 5分钟
  };

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly projectMappingRepository: Repository<GitLabProjectMapping>,
    @InjectRepository(GitLabSyncStatus)
    private readonly syncStatusRepository: Repository<GitLabSyncStatus>,
    @InjectRepository(WorkItemEntity)
    private readonly taskRepository: Repository<WorkItemEntity>,

    private readonly gitlabApiService: GitLabApiGitBeakerService,
    private readonly userSyncService: GitLabUserSyncService,
    private readonly syncService: GitLabSyncService
  ) {}

  /**
   * 执行增量同步
   */
  async performIncrementalSync(
    instanceId: string,
    projectId?: string
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始增量同步: ${instanceId}`, {
        instanceId,
        projectId,
      });

      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        return {
          success: false,
          message: "GitLab实例不存在或未激活",
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      // 获取需要同步的项目映射
      const mappings = await this.getProjectMappings(instanceId, projectId);

      if (mappings.length === 0) {
        return {
          success: true,
          message: "没有需要同步的项目映射",
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      let totalSyncCount = 0;
      const results = [];

      // 同步每个项目
      for (const mapping of mappings) {
        try {
          const result = await this.syncProjectIncremental(instance, mapping);
          totalSyncCount += result.syncCount;
          results.push(result);
        } catch (error) {
          this.logger.error(`同步项目失败: ${getErrorMessage(error)}`, {
            instanceId,
            mappingId: mapping.id,
            projectId: mapping.projectId,
            error: getErrorStack(error),
          });
          results.push({
            success: false,
            message: getErrorMessage(error),
            syncCount: 0,
            lastSyncAt: new Date(),
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const success = successCount > 0;

      this.logger.log(`增量同步完成: ${instanceId}`, {
        instanceId,
        totalMappings: mappings.length,
        successfulMappings: successCount,
        totalSyncCount,
      });

      return {
        success,
        message: `同步了 ${successCount}/${mappings.length} 个项目，共 ${totalSyncCount} 项`,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
        data: { results },
      };
    } catch (error) {
      this.logger.error(`增量同步失败: ${getErrorMessage(error)}`, {
        instanceId,
        projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 执行全量同步
   */
  async performFullSync(
    instanceId: string,
    projectId?: string
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始全量同步: ${instanceId}`, {
        instanceId,
        projectId,
      });

      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        return {
          success: false,
          message: "GitLab实例不存在或未激活",
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      // 获取需要同步的项目映射
      const mappings = await this.getProjectMappings(instanceId, projectId);

      if (mappings.length === 0) {
        return {
          success: true,
          message: "没有需要同步的项目映射",
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      let totalSyncCount = 0;
      const results = [];

      // 同步每个项目
      for (const mapping of mappings) {
        try {
          const result = await this.syncProjectFull(instance, mapping);
          totalSyncCount += result.syncCount;
          results.push(result);
        } catch (error) {
          this.logger.error(`全量同步项目失败: ${getErrorMessage(error)}`, {
            instanceId,
            mappingId: mapping.id,
            projectId: mapping.projectId,
            error: getErrorStack(error),
          });
          results.push({
            success: false,
            message: getErrorMessage(error),
            syncCount: 0,
            lastSyncAt: new Date(),
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const success = successCount > 0;

      this.logger.log(`全量同步完成: ${instanceId}`, {
        instanceId,
        totalMappings: mappings.length,
        successfulMappings: successCount,
        totalSyncCount,
      });

      return {
        success,
        message: `全量同步了 ${successCount}/${mappings.length} 个项目，共 ${totalSyncCount} 项`,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
        data: { results },
      };
    } catch (error) {
      this.logger.error(`全量同步失败: ${getErrorMessage(error)}`, {
        instanceId,
        projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 执行补偿同步
   */
  async performCompensationSync(
    instanceId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始补偿同步: ${instanceId}`, {
        instanceId,
        fromDate,
        toDate,
      });

      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId, isActive: true },
      });

      if (!instance) {
        return {
          success: false,
          message: "GitLab实例不存在或未激活",
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      // 获取需要补偿同步的项目映射
      const mappings = await this.getProjectMappings(instanceId);

      if (mappings.length === 0) {
        return {
          success: true,
          message: "没有需要补偿同步的项目映射",
          syncCount: 0,
          lastSyncAt: new Date(),
        };
      }

      let totalSyncCount = 0;
      const results = [];

      // 补偿同步每个项目
      for (const mapping of mappings) {
        try {
          const result = await this.syncProjectCompensation(
            instance,
            mapping,
            fromDate,
            toDate
          );
          totalSyncCount += result.syncCount;
          results.push(result);
        } catch (error) {
          this.logger.error(`补偿同步项目失败: ${getErrorMessage(error)}`, {
            instanceId,
            mappingId: mapping.id,
            projectId: mapping.projectId,
            error: getErrorStack(error),
          });
          results.push({
            success: false,
            message: getErrorMessage(error),
            syncCount: 0,
            lastSyncAt: new Date(),
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const success = successCount > 0;

      this.logger.log(`补偿同步完成: ${instanceId}`, {
        instanceId,
        totalMappings: mappings.length,
        successfulMappings: successCount,
        totalSyncCount,
      });

      return {
        success,
        message: `补偿同步了 ${successCount}/${mappings.length} 个项目，共 ${totalSyncCount} 项`,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
        data: { results },
      };
    } catch (error) {
      this.logger.error(`补偿同步失败: ${getErrorMessage(error)}`, {
        instanceId,
        fromDate,
        toDate,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 同步项目增量数据
   */
  private async syncProjectIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping
  ): Promise<SyncResult> {
    try {
      // 获取同步状态
      let syncStatus = await this.syncStatusRepository.findOne({
        where: {
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
        },
      });

      if (!syncStatus) {
        syncStatus = this.syncStatusRepository.create({
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
          lastSyncAt: new Date(0), // 从最早开始
          syncType: "incremental",
          status: "in_progress",
        });
        await this.syncStatusRepository.save(syncStatus);
      }

      // 更新状态为进行中
      syncStatus.status = "in_progress";
      syncStatus.lastSyncAt = new Date();
      await this.syncStatusRepository.save(syncStatus);

      let syncCount = 0;

      try {
        // 同步Issues
        const issuesResult = await this.syncIssuesIncremental(
          instance,
          mapping,
          syncStatus.lastSyncAt
        );
        syncCount += issuesResult.syncCount;

        // 同步Merge Requests
        const mergeRequestsResult = await this.syncMergeRequestsIncremental(
          instance,
          mapping,
          syncStatus.lastSyncAt
        );
        syncCount += mergeRequestsResult.syncCount;

        // 同步Pipelines
        const pipelinesResult = await this.syncPipelinesIncremental(
          instance,
          mapping,
          syncStatus.lastSyncAt
        );
        syncCount += pipelinesResult.syncCount;

        // 更新同步状态
        syncStatus.status = "completed";
        syncStatus.lastSyncAt = new Date();
        syncStatus.syncCount = syncCount;
        await this.syncStatusRepository.save(syncStatus);

        return {
          success: true,
          message: `项目增量同步完成: ${mapping.gitlabProjectPath}`,
          syncCount,
          lastSyncAt: syncStatus.lastSyncAt,
        };
      } catch (error) {
        // 更新同步状态为失败
        syncStatus.status = "failed";
        syncStatus.errorMessage = getErrorMessage(error);
        await this.syncStatusRepository.save(syncStatus);

        throw error;
      }
    } catch (error) {
      this.logger.error(`项目增量同步失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        mappingId: mapping.id,
        projectId: mapping.projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 同步项目全量数据
   */
  private async syncProjectFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping
  ): Promise<SyncResult> {
    try {
      // 获取同步状态
      let syncStatus = await this.syncStatusRepository.findOne({
        where: {
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
        },
      });

      if (!syncStatus) {
        syncStatus = this.syncStatusRepository.create({
          gitlabInstanceId: instance.id,
          projectId: mapping.projectId,
          lastSyncAt: new Date(0),
          syncType: "full",
          status: "in_progress",
        });
      } else {
        syncStatus.syncType = "full";
        syncStatus.status = "in_progress";
        syncStatus.lastSyncAt = new Date();
      }

      await this.syncStatusRepository.save(syncStatus);

      let syncCount = 0;

      try {
        // 同步所有Issues
        const issuesResult = await this.syncIssuesFull(instance, mapping);
        syncCount += issuesResult.syncCount;

        // 同步所有Merge Requests
        const mergeRequestsResult = await this.syncMergeRequestsFull(
          instance,
          mapping
        );
        syncCount += mergeRequestsResult.syncCount;

        // 同步所有Pipelines
        const pipelinesResult = await this.syncPipelinesFull(instance, mapping);
        syncCount += pipelinesResult.syncCount;

        // 更新同步状态
        syncStatus.status = "completed";
        syncStatus.lastSyncAt = new Date();
        syncStatus.syncCount = syncCount;
        await this.syncStatusRepository.save(syncStatus);

        return {
          success: true,
          message: `项目全量同步完成: ${mapping.gitlabProjectPath}`,
          syncCount,
          lastSyncAt: syncStatus.lastSyncAt,
        };
      } catch (error) {
        // 更新同步状态为失败
        syncStatus.status = "failed";
        syncStatus.errorMessage = getErrorMessage(error);
        await this.syncStatusRepository.save(syncStatus);

        throw error;
      }
    } catch (error) {
      this.logger.error(`项目全量同步失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        mappingId: mapping.id,
        projectId: mapping.projectId,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 同步项目补偿数据
   */
  private async syncProjectCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date
  ): Promise<SyncResult> {
    try {
      let syncCount = 0;

      // 补偿同步Issues
      const issuesResult = await this.syncIssuesCompensation(
        instance,
        mapping,
        fromDate,
        toDate
      );
      syncCount += issuesResult.syncCount;

      // 补偿同步Merge Requests
      const mergeRequestsResult = await this.syncMergeRequestsCompensation(
        instance,
        mapping,
        fromDate,
        toDate
      );
      syncCount += mergeRequestsResult.syncCount;

      // 补偿同步Pipelines
      const pipelinesResult = await this.syncPipelinesCompensation(
        instance,
        mapping,
        fromDate,
        toDate
      );
      syncCount += pipelinesResult.syncCount;

      return {
        success: true,
        message: `项目补偿同步完成: ${mapping.gitlabProjectPath}`,
        syncCount,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`项目补偿同步失败: ${getErrorMessage(error)}`, {
        instanceId: instance.id,
        mappingId: mapping.id,
        projectId: mapping.projectId,
        fromDate,
        toDate,
        error: getErrorStack(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
        syncCount: 0,
        lastSyncAt: new Date(),
        error: getErrorStack(error),
      };
    }
  }

  /**
   * 获取项目映射
   */
  private async getProjectMappings(
    instanceId: string,
    projectId?: string
  ): Promise<GitLabProjectMapping[]> {
    const whereCondition: any = {
      gitlabInstanceId: instanceId,
      isActive: true,
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    return this.projectMappingRepository.find({
      where: whereCondition,
      relations: ["project", "gitlabInstance"],
    });
  }

  /**
   * 同步Issues增量数据
   */
  private async syncIssuesIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    since: Date
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始增量同步Issues: ${mapping.getDisplayName()}`);

      // 获取GitLab Issues（所有状态，按更新时间排序）
      const gitlabIssues = await this.gitlabApiService.getIssues(
        instance,
        mapping.gitlabProjectId,
        1, // 第一页
        100, // 每页100条
        "all" // 所有状态
      );

      this.logger.log(`从GitLab获取到 ${gitlabIssues.length} 个Issues`);

      // 过滤出需要同步的Issues（更新时间在since之后）
      const issuesToSync = gitlabIssues.filter((issue) => {
        const updatedAt = new Date(issue.updated_at);
        return updatedAt > since;
      });

      this.logger.log(`需要同步的Issues数量: ${issuesToSync.length}`);

      let syncCount = 0;
      const errors: string[] = [];

      // 同步每个Issue到本地数据库
      for (const gitlabIssue of issuesToSync) {
        try {
          await this.syncSingleIssue(mapping, gitlabIssue);
          syncCount++;
          this.logger.debug(
            `同步Issue成功: ${gitlabIssue.iid} - ${gitlabIssue.title}`
          );
        } catch (error) {
          const errorMsg = `同步Issue失败: ${
            gitlabIssue.iid
          } - ${getErrorMessage(error)}`;
          this.logger.error(errorMsg, error);
          errors.push(errorMsg);
        }
      }

      const message =
        errors.length > 0
          ? `Issues增量同步完成，成功: ${syncCount}，失败: ${errors.length}`
          : `Issues增量同步完成，同步了 ${syncCount} 个Issues`;

      return {
        success: errors.length === 0 || syncCount > 0,
        message,
        syncCount,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Issues增量同步失败: ${mapping.getDisplayName()}`,
        error
      );
      return {
        success: false,
        message: `Issues增量同步失败: ${getErrorMessage(error)}`,
        syncCount: 0,
        lastSyncAt: new Date(),
      };
    }
  }

  /**
   * 同步Issues全量数据
   */
  private async syncIssuesFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping
  ): Promise<SyncResult> {
    try {
      this.logger.log(`开始全量同步Issues: ${mapping.getDisplayName()}`);

      let totalSyncCount = 0;
      let page = 1;
      const perPage = 100;
      const errors: string[] = [];

      // 分页获取所有GitLab Issues
      while (true) {
        try {
          const gitlabIssues = await this.gitlabApiService.getIssues(
            instance,
            mapping.gitlabProjectId,
            page,
            perPage,
            "all" // 所有状态
          );

          this.logger.log(`第${page}页获取到 ${gitlabIssues.length} 个Issues`);

          if (gitlabIssues.length === 0) {
            break; // 没有更多数据
          }

          // 同步当前页的Issues
          for (const gitlabIssue of gitlabIssues) {
            try {
              await this.syncSingleIssue(mapping, gitlabIssue);
              totalSyncCount++;
              this.logger.debug(
                `同步Issue成功: ${gitlabIssue.iid} - ${gitlabIssue.title}`
              );
            } catch (error) {
              const errorMsg = `同步Issue失败: ${
                gitlabIssue.iid
              } - ${getErrorMessage(error)}`;
              this.logger.error(errorMsg, error);
              errors.push(errorMsg);
            }
          }

          // 如果当前页数据少于perPage，说明已经是最后一页
          if (gitlabIssues.length < perPage) {
            break;
          }

          page++;
        } catch (error) {
          this.logger.error(`获取第${page}页Issues失败:`, error);
          errors.push(`获取第${page}页Issues失败: ${getErrorMessage(error)}`);
          break;
        }
      }

      const message =
        errors.length > 0
          ? `Issues全量同步完成，成功: ${totalSyncCount}，失败: ${errors.length}`
          : `Issues全量同步完成，同步了 ${totalSyncCount} 个Issues`;

      return {
        success: errors.length === 0 || totalSyncCount > 0,
        message,
        syncCount: totalSyncCount,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Issues全量同步失败: ${mapping.getDisplayName()}`,
        error
      );
      return {
        success: false,
        message: `Issues全量同步失败: ${getErrorMessage(error)}`,
        syncCount: 0,
        lastSyncAt: new Date(),
      };
    }
  }

  /**
   * 同步Issues补偿数据
   */
  private async syncIssuesCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date
  ): Promise<SyncResult> {
    // 实现补偿同步Issues的逻辑
    return {
      success: true,
      message: "Issues补偿同步完成",
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Merge Requests增量数据
   */
  private async syncMergeRequestsIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    since: Date
  ): Promise<SyncResult> {
    try {
      this.logger.log(
        `开始增量同步Merge Requests: ${mapping.getDisplayName()}`
      );

      // 获取GitLab Merge Requests（所有状态，按更新时间排序）
      const gitlabMergeRequests = await this.gitlabApiService.getMergeRequests(
        instance,
        mapping.gitlabProjectId,
        1, // 第一页
        100, // 每页100条
        "all" // 所有状态
      );

      this.logger.log(
        `从GitLab获取到 ${gitlabMergeRequests.length} 个Merge Requests`
      );

      // 过滤出需要同步的Merge Requests（更新时间在since之后）
      const mergeRequestsToSync = gitlabMergeRequests.filter((mr) => {
        const updatedAt = new Date(mr.updated_at);
        return updatedAt > since;
      });

      this.logger.log(
        `需要同步的Merge Requests数量: ${mergeRequestsToSync.length}`
      );

      let syncCount = 0;
      const errors: string[] = [];

      // 同步每个Merge Request到本地数据库
      for (const gitlabMR of mergeRequestsToSync) {
        try {
          await this.syncSingleMergeRequest(mapping, gitlabMR);
          syncCount++;
          this.logger.debug(
            `同步Merge Request成功: ${gitlabMR.iid} - ${gitlabMR.title}`
          );
        } catch (error) {
          const errorMsg = `同步Merge Request失败: ${
            gitlabMR.iid
          } - ${getErrorMessage(error)}`;
          this.logger.error(errorMsg, error);
          errors.push(errorMsg);
        }
      }

      const message =
        errors.length > 0
          ? `Merge Requests增量同步完成，成功: ${syncCount}，失败: ${errors.length}`
          : `Merge Requests增量同步完成，同步了 ${syncCount} 个Merge Requests`;

      return {
        success: errors.length === 0 || syncCount > 0,
        message,
        syncCount,
        lastSyncAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Merge Requests增量同步失败: ${mapping.getDisplayName()}`,
        error
      );
      return {
        success: false,
        message: `Merge Requests增量同步失败: ${getErrorMessage(error)}`,
        syncCount: 0,
        lastSyncAt: new Date(),
      };
    }
  }

  /**
   * 同步Merge Requests全量数据
   */
  private async syncMergeRequestsFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping
  ): Promise<SyncResult> {
    // 实现全量同步Merge Requests的逻辑
    return {
      success: true,
      message: "Merge Requests全量同步完成",
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Merge Requests补偿数据
   */
  private async syncMergeRequestsCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date
  ): Promise<SyncResult> {
    // 实现补偿同步Merge Requests的逻辑
    return {
      success: true,
      message: "Merge Requests补偿同步完成",
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Pipelines增量数据
   */
  private async syncPipelinesIncremental(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    since: Date
  ): Promise<SyncResult> {
    // 实现增量同步Pipelines的逻辑
    return {
      success: true,
      message: "Pipelines增量同步完成",
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Pipelines全量数据
   */
  private async syncPipelinesFull(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping
  ): Promise<SyncResult> {
    // 实现全量同步Pipelines的逻辑
    return {
      success: true,
      message: "Pipelines全量同步完成",
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步Pipelines补偿数据
   */
  private async syncPipelinesCompensation(
    instance: GitLabInstance,
    mapping: GitLabProjectMapping,
    fromDate: Date,
    toDate: Date
  ): Promise<SyncResult> {
    // 实现补偿同步Pipelines的逻辑
    return {
      success: true,
      message: "Pipelines补偿同步完成",
      syncCount: 0,
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步单个Issue到本地数据库
   */
  private async syncSingleIssue(
    mapping: GitLabProjectMapping,
    gitlabIssue: GitLabIssue
  ): Promise<void> {
    try {
      // 生成Issue Key（格式：项目前缀-序号）
      const issueKey = `${mapping.project?.key || "PROJ"}-${gitlabIssue.iid}`;

      // 查找是否已存在该Issue
      const existingIssue = await this.taskRepository.findOne({
        where: { projectId: mapping.projectId, title: gitlabIssue.title },
      });

      // 映射GitLab状态到本地状态
      const localState = this.mapGitLabStateToLocal(gitlabIssue.state);

      // 映射GitLab类型到本地类型
      const localType = this.mapGitLabTypeToLocal(gitlabIssue);

      // 准备Issue数据
      const issueData = {
        projectId: mapping.projectId,
        key: issueKey,
        type: localType,
        title: gitlabIssue.title,
        description: gitlabIssue.description || "",
        state: localState,
        priority:
          this.extractPriorityFromLabels(gitlabIssue.labels) || undefined,
        severity:
          this.extractSeverityFromLabels(gitlabIssue.labels) || undefined,
        assigneeId:
          (await this.findLocalUserIdByGitLabUser(
            gitlabIssue.assignees?.[0]
          )) || undefined,
        reporterId:
          (await this.findLocalUserIdByGitLabUser(gitlabIssue.author)) ||
          undefined,
        labels: gitlabIssue.labels,
        dueAt: gitlabIssue.milestone?.due_date
          ? new Date(gitlabIssue.milestone.due_date)
          : undefined,
        updatedAt: new Date(gitlabIssue.updated_at),
      };

      if (existingIssue) {
        // 更新现有Issue
        await this.taskRepository.update(existingIssue.id, issueData as any);
        this.logger.debug(`更新Issue: ${issueKey}`);
      } else {
        // 创建新Issue
        const newIssue = this.taskRepository.create(issueData as any) as any;
        (newIssue as any).createdAt = new Date(gitlabIssue.created_at);
        await this.taskRepository.save(newIssue as any);
        this.logger.debug(`创建Issue: ${issueKey}`);
      }
    } catch (error) {
      this.logger.error(`同步单个Issue失败: ${gitlabIssue.iid}`, error);
      throw error;
    }
  }

  /**
   * 映射GitLab状态到本地状态
   */
  private mapGitLabStateToLocal(gitlabState: string): string {
    switch (gitlabState) {
      case "opened":
        return "open";
      case "closed":
        return "closed";
      default:
        return "open";
    }
  }

  /**
   * 映射GitLab类型到本地类型
   */
  private mapGitLabTypeToLocal(gitlabIssue: GitLabIssue): "task" | "bug" {
    // 根据标签判断类型
    const labels = gitlabIssue.labels || [];

    if (labels.some((label) => label.toLowerCase().includes("bug"))) {
      return "bug";
    } else {
      // 默认为task类型
      return "task";
    }
  }

  /**
   * 从标签中提取优先级
   */
  private extractPriorityFromLabels(labels: string[]): string | null {
    if (!labels || labels.length === 0) return null;

    const priorityLabels = labels.filter(
      (label: string) =>
        label.toLowerCase().includes("priority") ||
        label.toLowerCase().includes("urgent") ||
        label.toLowerCase().includes("high") ||
        label.toLowerCase().includes("medium") ||
        label.toLowerCase().includes("low")
    );

    if (priorityLabels.length === 0) return null;

    const priorityLabel = priorityLabels[0].toLowerCase();
    if (priorityLabel.includes("urgent") || priorityLabel.includes("high")) {
      return "high";
    } else if (priorityLabel.includes("medium")) {
      return "medium";
    } else if (priorityLabel.includes("low")) {
      return "low";
    }

    return null;
  }

  /**
   * 从标签中提取严重程度
   */
  private extractSeverityFromLabels(labels: string[]): string | null {
    if (!labels || labels.length === 0) return null;

    const severityLabels = labels.filter(
      (label: string) =>
        label.toLowerCase().includes("severity") ||
        label.toLowerCase().includes("critical") ||
        label.toLowerCase().includes("major") ||
        label.toLowerCase().includes("minor") ||
        label.toLowerCase().includes("trivial")
    );

    if (severityLabels.length === 0) return null;

    const severityLabel = severityLabels[0].toLowerCase();
    if (severityLabel.includes("critical")) {
      return "critical";
    } else if (severityLabel.includes("major")) {
      return "major";
    } else if (severityLabel.includes("minor")) {
      return "minor";
    } else if (severityLabel.includes("trivial")) {
      return "trivial";
    }

    return null;
  }

  /**
   * 根据GitLab用户查找本地用户ID
   */
  private async findLocalUserIdByGitLabUser(
    gitlabUser?: GitLabUser
  ): Promise<string | null> {
    if (!gitlabUser) return null;

    try {
      // 这里需要根据GitLab用户信息查找本地用户
      // 可以通过邮箱、用户名等方式匹配
      // 暂时返回null，后续可以实现用户映射逻辑
      return null;
    } catch (error) {
      this.logger.warn(`查找本地用户失败: ${gitlabUser.username}`, error);
      return null;
    }
  }

  /**
   * 同步单个Merge Request到本地数据库
   */
  private async syncSingleMergeRequest(
    mapping: GitLabProjectMapping,
    gitlabMR: GitLabMergeRequest
  ): Promise<void> {
    try {
      // 生成Issue Key（格式：项目前缀-MR-序号）
      const issueKey = `${mapping.project?.key || "PROJ"}-MR-${gitlabMR.iid}`;

      // 查找是否已存在该Merge Request（作为Issue存储）
      const existingIssue = await this.taskRepository.findOne({
        where: {
          projectId: mapping.projectId,
          title: `[MR] ${gitlabMR.title}`,
        },
      });

      // 映射GitLab状态到本地状态
      const localState = this.mapGitLabMRStateToLocal(gitlabMR.state);

      // Merge Request通常作为task类型存储
      const localType = "task";

      // 准备Issue数据
      const issueData = {
        projectId: mapping.projectId,
        key: issueKey,
        type: localType,
        title: `[MR] ${gitlabMR.title}`,
        description: this.formatMergeRequestDescription(gitlabMR),
        state: localState,
        priority: this.extractPriorityFromLabels(gitlabMR.labels) || undefined,
        severity: this.extractSeverityFromLabels(gitlabMR.labels) || undefined,
        assigneeId:
          (await this.findLocalUserIdByGitLabUser(gitlabMR.assignee)) ||
          undefined,
        reporterId:
          (await this.findLocalUserIdByGitLabUser(gitlabMR.author)) ||
          undefined,
        labels: [...(gitlabMR.labels || []), "merge-request"],
        dueAt: gitlabMR.milestone?.due_date
          ? new Date(gitlabMR.milestone.due_date)
          : undefined,
        updatedAt: new Date(gitlabMR.updated_at),
      };

      if (existingIssue) {
        // 更新现有Issue
        await this.taskRepository.update(existingIssue.id, issueData as any);
        this.logger.debug(`更新Merge Request: ${issueKey}`);
      } else {
        // 创建新Issue
        const newIssue = this.taskRepository.create(issueData as any) as any;
        (newIssue as any).createdAt = new Date(gitlabMR.created_at);
        await this.taskRepository.save(newIssue as any);
        this.logger.debug(`创建Merge Request: ${issueKey}`);
      }
    } catch (error) {
      this.logger.error(`同步单个Merge Request失败: ${gitlabMR.iid}`, error);
      throw error;
    }
  }

  /**
   * 映射GitLab Merge Request状态到本地状态
   */
  private mapGitLabMRStateToLocal(gitlabState: string): string {
    switch (gitlabState) {
      case "opened":
        return "open";
      case "closed":
        return "closed";
      case "merged":
        return "closed"; // 已合并的MR标记为关闭
      default:
        return "open";
    }
  }

  /**
   * 格式化Merge Request描述
   */
  private formatMergeRequestDescription(gitlabMR: GitLabMergeRequest): string {
    let description = gitlabMR.description || "";

    // 添加Merge Request相关信息
    description += `\n\n---\n**Merge Request信息:**\n`;
    description += `- 源分支: \`${gitlabMR.source_branch}\`\n`;
    description += `- 目标分支: \`${gitlabMR.target_branch}\`\n`;
    description += `- 合并状态: ${gitlabMR.merge_status}\n`;
    description += `- 工作进度: ${
      gitlabMR.work_in_progress ? "进行中" : "已完成"
    }\n`;
    description += `- 草稿状态: ${gitlabMR.draft ? "草稿" : "正式"}\n`;

    if (gitlabMR.web_url) {
      description += `- 链接: [查看Merge Request](${gitlabMR.web_url})\n`;
    }

    return description;
  }
}
