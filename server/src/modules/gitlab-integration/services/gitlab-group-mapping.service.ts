import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabGroupMapping } from '../core/entities/gitlab-group-mapping.entity';
import { ProjectEntity as Project } from '../../projects/project.entity';
import { GitLabInstance } from '../core/entities/gitlab-instance.entity';
import { CreateGroupMappingDto } from '../dto/create-group-mapping.dto';
import { UpdateGroupMappingDto } from '../dto/update-group-mapping.dto';
import { GroupMappingResponseDto } from '../dto/group-mapping-response.dto';
import { GitLabApiGitBeakerService } from './gitlab-api-gitbeaker.service';

// 错误处理辅助函数
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * GitLab分组映射服务
 * 负责管理PM项目与GitLab分组的映射关系
 */
@Injectable()
export class GitLabGroupMappingService {
  private readonly logger = new Logger(GitLabGroupMappingService.name);

  constructor(
    @InjectRepository(GitLabGroupMapping)
    private readonly groupMappingRepository: Repository<GitLabGroupMapping>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(GitLabInstance)
    private readonly gitlabInstanceRepository: Repository<GitLabInstance>,
    private readonly gitlabApiService: GitLabApiGitBeakerService,
  ) {}

  /**
   * 创建分组映射
   */
  async createGroupMapping(
    projectId: string,
    dto: CreateGroupMappingDto
  ): Promise<GroupMappingResponseDto> {
    this.logger.log(`创建分组映射: ${projectId} -> ${dto.gitlabGroupPath}`, {
      projectId,
      gitlabInstanceId: dto.gitlabInstanceId,
      gitlabGroupId: dto.gitlabGroupId,
    });

    // 验证项目是否存在
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`项目 "${projectId}" 不存在`);
    }

    // 验证GitLab实例是否存在
    const instance = await this.gitlabInstanceRepository.findOne({
      where: { id: dto.gitlabInstanceId },
    });

    if (!instance) {
      throw new NotFoundException(`GitLab实例 "${dto.gitlabInstanceId}" 不存在`);
    }

    // 检查映射是否已存在
    const existingMapping = await this.groupMappingRepository.findOne({
      where: {
        projectId,
        gitlabInstanceId: dto.gitlabInstanceId,
        gitlabGroupId: dto.gitlabGroupId,
      },
    });

    if (existingMapping) {
      throw new ConflictException("分组映射已存在");
    }

    // 验证GitLab分组是否存在并获取分组信息
    let groupInfo;
    try {
      groupInfo = await this.gitlabApiService.getGroup(instance, String(dto.gitlabGroupId));
      if (!groupInfo) {
          throw new NotFoundException("GitLab分组不存在");
      }
    } catch (error) {
      throw new BadRequestException(
        `无法访问GitLab分组: ${getErrorMessage(error)}`
      );
    }

    // 创建映射
    const mapping = this.groupMappingRepository.create({
      projectId,
      gitlabInstanceId: dto.gitlabInstanceId,
      gitlabGroupId: dto.gitlabGroupId,
      gitlabGroupPath: dto.gitlabGroupPath,
    });

    const savedMapping = await this.groupMappingRepository.save(mapping);

    this.logger.log(`分组映射创建成功: ${savedMapping.id}`);

    return this.mapToResponseDto(savedMapping, groupInfo);
  }

  /**
   * 获取项目的分组映射列表
   */
  async getProjectGroupMappings(projectId: string): Promise<GroupMappingResponseDto[]> {
    this.logger.debug(`获取项目分组映射列表: ${projectId}`);

    const mappings = await this.groupMappingRepository.find({
      where: { projectId },
      relations: ['gitlabInstance'],
      order: { createdAt: 'DESC' },
    });

    // 获取分组详细信息
    const responseDtos: GroupMappingResponseDto[] = [];
    for (const mapping of mappings) {
      try {
        const groupInfo = await this.gitlabApiService.getGroup(
          mapping.gitlabInstance,
          String(mapping.gitlabGroupId)
        );
        responseDtos.push(this.mapToResponseDto(mapping, groupInfo));
      } catch (error) {
        this.logger.warn(`无法获取分组信息: ${mapping.gitlabGroupId}`, error);
        // 即使无法获取分组信息，也返回基本映射信息
        responseDtos.push(this.mapToResponseDto(mapping));
      }
    }

    return responseDtos;
  }

  /**
   * 更新分组映射
   */
  async updateGroupMapping(
    mappingId: string,
    dto: UpdateGroupMappingDto
  ): Promise<GroupMappingResponseDto> {
    this.logger.log(`更新分组映射: ${mappingId}`);

    const mapping = await this.groupMappingRepository.findOne({
      where: { id: mappingId },
      relations: ['gitlabInstance'],
    });

    if (!mapping) {
      throw new NotFoundException(`分组映射 "${mappingId}" 不存在`);
    }

    // 更新字段
    if (dto.isActive !== undefined) {
      mapping.isActive = dto.isActive;
    }

    const savedMapping = await this.groupMappingRepository.save(mapping);

    // 获取分组信息
    let groupInfo;
    try {
      groupInfo = await this.gitlabApiService.getGroup(
        mapping.gitlabInstance,
        String(mapping.gitlabGroupId)
      );
    } catch (error) {
      this.logger.warn(`无法获取分组信息: ${mapping.gitlabGroupId}`, error);
    }

    return this.mapToResponseDto(savedMapping, groupInfo);
  }

  /**
   * 删除分组映射
   */
  async deleteGroupMapping(mappingId: string): Promise<void> {
    this.logger.log(`删除分组映射: ${mappingId}`);

    const mapping = await this.groupMappingRepository.findOne({
      where: { id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException(`分组映射 "${mappingId}" 不存在`);
    }

    await this.groupMappingRepository.remove(mapping);

    this.logger.log(`分组映射删除成功: ${mappingId}`);
  }

  /**
   * 验证分组访问权限
   */
  private async validateGroupAccess(instance: GitLabInstance, groupId: number): Promise<boolean> {
    try {
      await this.gitlabApiService.getGroup(instance, String(groupId));
      return true;
    } catch (error) {
      this.logger.warn(`分组访问权限验证失败: ${groupId}`, error);
      return false;
    }
  }

  /**
   * 映射实体到响应DTO
   */
  private mapToResponseDto(
    mapping: GitLabGroupMapping,
    groupInfo?: any
  ): GroupMappingResponseDto {
    return {
      id: mapping.id,
      projectId: mapping.projectId,
      gitlabInstanceId: mapping.gitlabInstanceId,
      gitlabGroupId: mapping.gitlabGroupId,
      gitlabGroupPath: mapping.gitlabGroupPath,
      groupName: groupInfo?.name || 'Unknown Group',
      groupDescription: groupInfo?.description,
      groupVisibility: groupInfo?.visibility || 'unknown',
      groupProjectsCount: groupInfo?.projectsCount || 0,
      isActive: mapping.isActive,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      syncCount: 0,
    };
  }
}
