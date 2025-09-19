import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GitLabEpicMapping } from   "../core/entities/gitlab-epic-mapping.entity";
import { GitLabInstance } from "../core/entities/gitlab-instance.entity";
import { GitLabGroupMapping } from "../core/entities/gitlab-group-mapping.entity";

import { GitLabApiGitBeakerService } from "./gitlab-api-gitbeaker.service";
import { RequirementEntity } from "../../requirements/requirement.entity";
import { FeatureModuleEntity } from "../../feature-modules/feature-module.entity";
import { GitLabEpic, GitLabGroup } from "../interfaces/gitlab-api.interface";
import { GitLabProjectMapping } from "../core/entities/gitlab-project-mapping.entity";

/**
 * GitLab Epic同步服务
  * 负责PM系统中的需求功能模块/子系统与GitLab Epic的双向同步
 */
@Injectable()
export class GitLabEpicSyncService {
  private readonly logger = new Logger(GitLabEpicSyncService.name);

  constructor(
    @InjectRepository(GitLabEpicMapping)
    private readonly epicMappingRepository: Repository<GitLabEpicMapping>,
    @InjectRepository(GitLabInstance)
    private readonly instanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly projectMappingRepository: Repository<GitLabProjectMapping>,
    @InjectRepository(RequirementEntity)
    private readonly requirementRepository: Repository<RequirementEntity>,
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepository: Repository<FeatureModuleEntity>,
    private readonly gitlabApiService: GitLabApiGitBeakerService
  ) {}

  /**
   * 同步PM系统实体到GitLab Epic
   */
  async syncToGitLabEpic(
    projectId: string,
    entityType: "requirement" | "subsystem" | "feature_module",
    entityId: string
  ): Promise<{ success: boolean; epicId?: number; message: string }> {
    try {
      this.logger.debug(`同步PM实体到GitLab Epic: ${entityType}:${entityId}`, {
        projectId,
        entityType,
        entityId,
      });

      // 获取项目映射
      const projectMapping = await this.projectMappingRepository.findOne({
        where: { projectId },
        relations: ["gitlabInstance"],
      });

      if (!projectMapping) {
        return {
          success: false,
          message: "未找到项目映射",
        };
      }

      // 获取实体数据
      const entity = await this.getEntityData(entityType, entityId);
      if (!entity) {
        return {
          success: false,
          message: "实体不存在",
        };
      }

      // 检查是否已存在映射
      let mapping = await this.epicMappingRepository.findOne({
        where: {
          projectId,
          entityType,
          entityId,
        },
      });

      if (mapping) {
        // 更新现有Epic
        return await this.updateGitLabEpic(mapping, entity, projectMapping);
      } else {
        // 创建新Epic
        return await this.createGitLabEpic(entity, entityType, projectMapping);
      }
    } catch (error) {
      const err = error as any;
      this.logger.error(`同步到GitLab Epic失败: ${err?.message}`, {
        projectId,
        entityType,
        entityId,
        error: err?.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err?.message}`,
      };
    }
  }

  /**
   * 从GitLab同步Epic到PM系统
   */
  async syncFromGitLabEpic(
    instanceId: string,
    groupId: string,
    epicId: number
  ): Promise<{ success: boolean; entityId?: string; message: string }> {
    try {
      this.logger.debug(`从GitLab同步Epic: ${epicId}`, {
        instanceId,
        groupId,
        epicId,
      });

      // 获取GitLab实例
      const instance = await this.instanceRepository.findOne({
        where: { id: instanceId },
      });

      if (!instance) {
        return {
          success: false,
          message: "GitLab实例不存在",
        };
      }

      // 获取Epic数据
      const epic = await this.gitlabApiService.getEpic(
        instance,
        groupId,
        epicId
      );
      if (!epic) {
        return {
          success: false,
          message: "GitLab Epic不存在",
        };
      }

      // 查找项目映射
      const projectMapping = await this.projectMappingRepository.findOne({
        where: {
          gitlabInstanceId: instanceId,
          gitlabGroupId: Number(groupId), // 这里使用groupId作为分组ID
        },
      });

      if (!projectMapping) {
        return {
          success: false,
          message: "未找到项目映射",
        };
      }

      // 检查是否已存在映射
      let mapping = await this.epicMappingRepository.findOne({
        where: {
          gitlabInstanceId: instanceId,
          gitlabGroupId: Number(groupId),
          gitlabEpicId: epicId,
        },
      });

      if (mapping) {
        // 更新现有实体
        return await this.updatePmEntity(mapping, epic);
      } else {
        // 创建新实体
        return await this.createPmEntity(epic, projectMapping.projectId);
      }
    } catch (error) {
      const err = error as any;
      this.logger.error(`从GitLab同步Epic失败: ${err?.message}`, {
        instanceId,
        groupId,
        epicId,
        error: err?.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err?.message}`,
      };
    }
  }

  /**
   * 获取实体数据
   */
  private async getEntityData(
    entityType: "requirement" | "subsystem" | "feature_module",
    entityId: string
  ) {
    switch (entityType) {
      case "requirement":
        return await this.requirementRepository.findOne({
          where: { id: entityId },
        });
      case "feature_module":
        return await this.featureModuleRepository.findOne({
          where: { id: entityId },
        });
      default:
        return null;
    }
  }

  /**
   * 创建GitLab Epic
   */
  private async createGitLabEpic(
    entity: any,
    entityType: "requirement" | "subsystem" | "feature_module",
    projectMapping: GitLabProjectMapping
  ) {
    try {
      // 创建Epic数据
      const epicData = {
        title: entity.title,
        description: entity.description || "",
        labels: this.generateEpicLabels(entityType, entity),
      };

      // 调用GitLab API创建Epic
      const epic = await this.gitlabApiService.createEpic(
        projectMapping.gitlabInstance,
        String(projectMapping.gitlabGroupId), // 使用groupId
        epicData
      );

      if (!epic) {
        return {
          success: false,
          message: "创建GitLab Epic失败",
        };
      }

      // 创建映射记录
      const mapping = this.epicMappingRepository.create({
        projectId: projectMapping.projectId,
        gitlabInstanceId: projectMapping.gitlabInstanceId,
        gitlabGroupId: projectMapping.gitlabGroupId,
        gitlabEpicId: epic.id,
        entityType,
        entityId: entity.id,
        isActive: true,
        lastSyncAt: new Date(),
      });

      await this.epicMappingRepository.save(mapping);

      this.logger.log(`创建GitLab Epic成功: ${epic.id}`, {
        projectId: projectMapping.projectId,
        entityType,
        entityId: entity.id,
        epicId: epic.id,
      });

      return {
        success: true,
        epicId: epic.id,
        message: "创建GitLab Epic成功",
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(`创建GitLab Epic失败: ${err?.message}`, err);
      return {
        success: false,
        message: `创建失败: ${err?.message}`,
      };
    }
  }

  /**
   * 更新GitLab Epic
   */
  private async updateGitLabEpic(
    mapping: GitLabEpicMapping,
    entity: any,
    projectMapping: GitLabGroupMapping
  ) {
    try {
      // 更新Epic数据
      const epicData = {
        title: entity.title,
        description: entity.description || "",
        labels: this.generateEpicLabels(mapping.entityType, entity),
      };

      // 调用GitLab API更新Epic
      const epic = await this.gitlabApiService.updateEpic(
        projectMapping.gitlabInstance,
        String(mapping.gitlabGroupId),
        mapping.gitlabEpicId,
        epicData
      );

      if (!epic) {
        return {
          success: false,
          message: "更新GitLab Epic失败",
        };
      }

      // 更新映射记录
      mapping.lastSyncAt = new Date();
      await this.epicMappingRepository.save(mapping);

      this.logger.log(`更新GitLab Epic成功: ${epic.id}`, {
        mappingId: mapping.id,
        epicId: epic.id,
      });

      return {
        success: true,
        epicId: epic.id,
        message: "更新GitLab Epic成功",
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(`更新GitLab Epic失败: ${err?.message}`, err);
      return {
        success: false,
        message: `更新失败: ${err?.message}`,
      };
    }
  }

  /**
   * 创建PM系统实体
   */
  private async createPmEntity(epic: GitLabEpic, projectId: string) {
    try {
      // 根据Epic标签确定实体类型
      const entityType = this.determineEntityTypeFromEpic(epic);

      // 创建实体数据
      const entityData: any = {
        projectId,
        title: epic.title,
        description: epic.description || "",
        state: this.mapGitLabEpicStateToLocal(epic.state),
        priority: this.extractPriorityFromLabels(epic.labels) || undefined,
        labels: epic.labels,
        dueAt: epic.due_date ? new Date(epic.due_date) : undefined,
      };

      let entity: any;
      let entityId: string;

      switch (entityType) {
        case "requirement":
          entity = this.requirementRepository.create(entityData);
          await this.requirementRepository.save(entity);
          entityId = entity.id;
          break;

        case "feature_module":
          entity = this.featureModuleRepository.create(entityData);
          await this.featureModuleRepository.save(entity);
          entityId = entity.id;
          break;
        default:
          return {
            success: false,
            message: "无法确定实体类型",
          };
      }

      // 创建映射记录
      const mapping = this.epicMappingRepository.create({
        projectId,
        gitlabInstanceId: (epic as any).gitlabInstanceId || "",
        gitlabGroupId: epic.group_id,
        gitlabEpicId: epic.id,
        entityType,
        entityId,
        isActive: true,
        lastSyncAt: new Date(),
      });

      await this.epicMappingRepository.save(mapping);

      this.logger.log(`创建PM实体成功: ${entityType}:${entityId}`, {
        projectId,
        entityType,
        entityId,
        epicId: epic.id,
      });

      return {
        success: true,
        entityId,
        message: `创建${entityType}成功`,
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(`创建PM实体失败: ${err?.message}`, err);
      return {
        success: false,
        message: `创建失败: ${err?.message}`,
      };
    }
  }

  /**
   * 更新PM系统实体
   */
  private async updatePmEntity(mapping: GitLabEpicMapping, epic: GitLabEpic) {
    try {
      // 更新实体数据
      const updateData = {
        title: epic.title,
        description: epic.description || "",
        state: this.mapGitLabEpicStateToLocal(epic.state),
        priority: this.extractPriorityFromLabels(epic.labels),
        labels: epic.labels,
        dueAt: epic.due_date ? new Date(epic.due_date) : undefined,
      };

      let repository;
      switch (mapping.entityType) {
        case "requirement":
          repository = this.requirementRepository;
          break;

        case "feature_module":
          repository = this.featureModuleRepository;
          break;
        default:
          return {
            success: false,
            message: "无效的实体类型",
          };
      }

      await repository.update(mapping.entityId, updateData as any);

      // 更新映射记录
      mapping.lastSyncAt = new Date();
      await this.epicMappingRepository.save(mapping);

      this.logger.log(
        `更新PM实体成功: ${mapping.entityType}:${mapping.entityId}`,
        {
          mappingId: mapping.id,
          epicId: epic.id,
        }
      );

      return {
        success: true,
        entityId: mapping.entityId,
        message: `更新${mapping.entityType}成功`,
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(`更新PM实体失败: ${err?.message}`, err);
      return {
        success: false,
        message: `更新失败: ${err?.message}`,
      };
    }
  }

  /**
   * 生成Epic标签
   */
  private generateEpicLabels(
    entityType: "requirement" | "subsystem" | "feature_module",
    entity: any
  ): string[] {
    const labels: string[] = [entityType];

    if (entity.priority) {
      labels.push(`priority:${String(entity.priority)}`);
    }

    if (entity.labels && Array.isArray(entity.labels)) {
      labels.push(...entity.labels);
    }

    return labels;
  }

  /**
   * 根据Epic确定实体类型
   */
  private determineEntityTypeFromEpic(
    epic: GitLabEpic
  ): "requirement" | "subsystem" | "feature_module" {
    const labels = epic.labels || [];

    if (labels.some((label) => label.toLowerCase().includes("requirement"))) {
      return "requirement";
    } else if (
      labels.some((label) => label.toLowerCase().includes("subsystem"))
    ) {
      return "subsystem";
    } else if (
      labels.some((label) => label.toLowerCase().includes("feature"))
    ) {
      return "feature_module";
    } else {
      // 默认根据标题判断
      const title = epic.title.toLowerCase();
      if (title.includes("requirement") || title.includes("需求")) {
        return "requirement";
      } else if (title.includes("subsystem") || title.includes("子系统")) {
        return "subsystem";
      } else {
        return "feature_module";
      }
    }
  }

  /**
   * 映射GitLab Epic状态到本地状态
   */
  private mapGitLabEpicStateToLocal(gitlabState: string): string {
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
   * 从标签中提取优先级
   */
  private extractPriorityFromLabels(labels: string[]): string | null {
    const priorityLabel = labels.find((label) =>
      label.toLowerCase().startsWith("priority:")
    );
    return priorityLabel ? priorityLabel.split(":")[1] : null;
  }

  /**
   * 获取实体的Epic映射
   */
  async getEntityEpicMapping(
    projectId: string,
    entityType: "requirement" | "subsystem" | "feature_module",
    entityId: string
  ): Promise<GitLabEpicMapping | null> {
    return await this.epicMappingRepository.findOne({
      where: {
        projectId,
        entityType,
        entityId,
      },
      relations: ["gitlabInstance"],
    });
  }

  /**
   * 删除Epic映射
   */
  async deleteEpicMapping(
    mappingId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const mapping = await this.epicMappingRepository.findOne({
        where: { id: mappingId },
      });

      if (!mapping) {
        return {
          success: false,
          message: "映射不存在",
        };
      }

      // 删除GitLab Epic（可选）
      if (mapping.isActive) {
        try {
          await this.gitlabApiService.deleteEpic(
            mapping.gitlabInstance!,
            String(mapping.gitlabGroupId),
            mapping.gitlabEpicId
          );
        } catch (error) {
          const err = error as any;
          this.logger.warn(`删除GitLab Epic失败: ${err?.message}`, {
            mappingId,
            epicId: mapping.gitlabEpicId,
          });
        }
      }

      // 删除映射记录
      await this.epicMappingRepository.delete(mappingId);

      this.logger.log(`删除Epic映射成功: ${mappingId}`);
      return {
        success: true,
        message: "删除成功",
      };
    } catch (error) {
      const err = error as any;
      this.logger.error(`删除Epic映射失败: ${err?.message}`, err);
      return {
        success: false,
        message: `删除失败: ${err?.message}`,
      };
    }
  }
}
