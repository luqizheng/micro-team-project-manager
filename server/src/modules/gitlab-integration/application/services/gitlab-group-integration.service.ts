/**
 * GitLab分组集成服务
 * 负责GitLab实例和分组映射的管理
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGitLabIntegrationService } from '../../core/interfaces/gitlab-integration.interface';
import { IGitLabInstanceRepository } from '../../core/interfaces/gitlab-repository.interface';
import { IGitLabGroupMappingRepository } from '../../core/interfaces/gitlab-repository.interface';
import { IGitLabApiClient } from '../../core/interfaces/gitlab-api.interface';
import { EncryptHelper } from '../../../../common/utils';
import { GitLabCacheService } from '../../infrastructure/cache/gitlab-cache.service';
import { GitLabCacheKeys } from '../../infrastructure/cache/gitlab-cache-keys';
import { CreateGitLabInstanceDto, UpdateGitLabInstanceDto, GitLabInstanceResponseDto } from '../../presentation/dto/gitlab-instance.dto';
import { CreateGroupMappingDto, UpdateGroupMappingDto, GroupMappingResponseDto } from '../../presentation/dto/gitlab-group-mapping.dto';
import { GitLabInstance } from '../../core/entities/gitlab-instance.entity';
import { GitLabGroupMapping } from '../../core/entities/gitlab-group-mapping.entity';
import {
  GitLabInstanceNotFoundException,
  GitLabInstanceAlreadyExistsException,
  GitLabInstanceInvalidConfigException,
  GitLabInstanceConnectionFailedException,
} from '../../shared/exceptions/gitlab-instance.exception';
import { GitLabValidationException } from '../../shared/exceptions/gitlab-validation.exception';
import { InstanceType } from '../../core/enums';

/**
 * GitLab分组集成服务实现
 * 提供GitLab实例和分组映射的管理功能
 */
@Injectable()
export class GitLabGroupIntegrationService implements IGitLabIntegrationService {
  private readonly logger = new Logger(GitLabGroupIntegrationService.name);

  constructor(
    @Inject('IGitLabInstanceRepository') private readonly instanceRepository: IGitLabInstanceRepository,
    @Inject('IGitLabGroupMappingRepository') private readonly groupMappingRepository: IGitLabGroupMappingRepository,
    @Inject('IGitLabApiClient') private readonly apiClient: IGitLabApiClient,
    private readonly cacheService: GitLabCacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 创建GitLab实例
   */
  async createInstance(dto: CreateGitLabInstanceDto): Promise<GitLabInstanceResponseDto> {
    try {
      // 验证配置
      this.validateInstanceConfig(dto);

      // 检查实例是否已存在
      const existingInstance = await this.instanceRepository.findByBaseUrl(dto.baseUrl);
      if (existingInstance) {
        throw new GitLabInstanceAlreadyExistsException(dto.baseUrl);
      }

      // 测试连接
      await this.testInstanceConnection(dto);

      // 创建实例实体
      const instance = new GitLabInstance();
      instance.name = dto.name;
      instance.baseUrl = dto.baseUrl;
      instance.apiToken = EncryptHelper.encryptApiTokenWithConfig(dto.apiToken, this.configService);
      instance.webhookSecret = dto.webhookSecret;
      instance.instanceType = dto.instanceType || 'self_hosted';
      instance.isActive = dto.isActive ?? true;

      // 保存实例
      const savedInstance = await this.instanceRepository.save(instance);

      // 清理缓存
      await this.clearInstanceCache();

      this.logger.log(`创建GitLab实例成功: ${savedInstance.id}`);
      return this.mapInstanceToResponseDto(savedInstance);
    } catch (error) {
      this.logger.error(`创建GitLab实例失败: ${dto.name}`, error);
      throw error;
    }
  }

  /**
   * 更新GitLab实例
   */
  async updateInstance(id: string, dto: UpdateGitLabInstanceDto): Promise<GitLabInstanceResponseDto> {
    try {
      // 查找实例
      const existingInstance = await this.instanceRepository.findById(id);
      if (!existingInstance) {
        throw new GitLabInstanceNotFoundException(id);
      }

      // 验证配置
      if (dto.name || dto.baseUrl || dto.apiToken) {
        this.validateInstanceConfig({
          name: dto.name || existingInstance.name,
          baseUrl: dto.baseUrl || existingInstance.baseUrl,
          apiToken: dto.apiToken || EncryptHelper.decryptApiTokenWithConfig(existingInstance.apiToken, this.configService),
        });
      }

      // 如果更新了连接信息，测试连接
      if (dto.baseUrl || dto.apiToken) {
        await this.testInstanceConnection({
          name: dto.name || existingInstance.name,
          baseUrl: dto.baseUrl || existingInstance.baseUrl,
          apiToken: dto.apiToken || EncryptHelper.decryptApiTokenWithConfig(existingInstance.apiToken, this.configService),
        });
      }

      // 更新实例
      const updatedInstance = await this.instanceRepository.update(id, {
        ...dto,
          apiToken: dto.apiToken ? EncryptHelper.encryptApiTokenWithConfig(dto.apiToken, this.configService) : undefined,
      });

      // 清理缓存
      await this.clearInstanceCache();

      this.logger.log(`更新GitLab实例成功: ${id}`);
      return this.mapInstanceToResponseDto(updatedInstance);
    } catch (error) {
      this.logger.error(`更新GitLab实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除GitLab实例
   */
  async deleteInstance(id: string): Promise<void> {
    try {
      // 查找实例
      const existingInstance = await this.instanceRepository.findById(id);
      if (!existingInstance) {
        throw new GitLabInstanceNotFoundException(id);
      }

      // 删除实例
      await this.instanceRepository.delete(id);

      // 清理缓存
      await this.clearInstanceCache();

      this.logger.log(`删除GitLab实例成功: ${id}`);
    } catch (error) {
      this.logger.error(`删除GitLab实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取GitLab实例
   */
  async getInstance(id: string): Promise<GitLabInstanceResponseDto> {
    try {
      const instance = await this.instanceRepository.findById(id);
      if (!instance) {
        throw new GitLabInstanceNotFoundException(id);
      }
      return this.mapInstanceToResponseDto(instance);
    } catch (error) {
      this.logger.error(`获取GitLab实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取GitLab实例实体
   */
  async getInstanceEntity(id: string): Promise<GitLabInstance> {
    try {
      const instance = await this.instanceRepository.findById(id);
      if (!instance) {
        throw new GitLabInstanceNotFoundException(id);
      }
      return instance;
    } catch (error) {
      this.logger.error(`获取GitLab实例实体失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取所有GitLab实例
   */
  async listInstances(): Promise<GitLabInstanceResponseDto[]> {
    try {
      const instances = await this.instanceRepository.findAll();
      return instances.map(instance => this.mapInstanceToResponseDto(instance));
    } catch (error) {
      this.logger.error('获取GitLab实例列表失败', error);
      throw error;
    }
  }

  /**
   * 创建分组映射
   */
  async createGroupMapping(dto: CreateGroupMappingDto): Promise<GroupMappingResponseDto> {
    try {
      // 验证实例是否存在
      const instance = await this.instanceRepository.findById(dto.instanceId);
      if (!instance) {
        throw new GitLabInstanceNotFoundException(dto.instanceId);
      }

      // 检查映射是否已存在
      const existingMapping = await this.groupMappingRepository.findByProjectId(dto.projectId);
      if (existingMapping) {
        throw new GitLabValidationException(`分组映射已存在 ${dto.projectId}`);
      }

      // 创建映射实体
      const mapping = new GitLabGroupMapping();
      mapping.gitlabInstance = instance;
      mapping.projectId = dto.projectId;
      mapping.gitlabGroupId = dto.gitlabGroupId;
      mapping.gitlabGroupPath = dto.gitlabGroupPath || '';
      mapping.isActive = dto.syncEnabled ?? true;

      // 保存映射
      const savedMapping = await this.groupMappingRepository.save(mapping);

      // 清理缓存
      await this.clearGroupMappingCache(dto.instanceId);

      this.logger.log(`创建分组映射成功: ${savedMapping.id}`);
      return this.mapGroupMappingToResponseDto(savedMapping);
    } catch (error) {
      this.logger.error(`创建分组映射失败: ${dto.projectId}`, error);
      throw error;
    }
  }

  /**
   * 更新分组映射
   */
  async updateGroupMapping(id: string, dto: UpdateGroupMappingDto): Promise<GroupMappingResponseDto> {
    try {
      // 查找映射
      const existingMapping = await this.groupMappingRepository.findById(id);
      if (!existingMapping) {
        throw new GitLabValidationException(`分组映射未找到 ${id}`);
      }

      // 更新映射
      const updatedMapping = await this.groupMappingRepository.update(id, dto);

      // 清理缓存
      await this.clearGroupMappingCache(existingMapping.gitlabInstance.id);

      this.logger.log(`更新分组映射成功: ${id}`);
      return this.mapGroupMappingToResponseDto(updatedMapping);
    } catch (error) {
      this.logger.error(`更新分组映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除分组映射
   */
  async deleteGroupMapping(id: string): Promise<void> {
    try {
      // 查找映射
      const existingMapping = await this.groupMappingRepository.findById(id);
      if (!existingMapping) {
        throw new GitLabValidationException(`分组映射未找到 ${id}`);
      }

      // 删除映射
      await this.groupMappingRepository.delete(id);

      // 清理缓存
      await this.clearGroupMappingCache(existingMapping.gitlabInstance.id);

      this.logger.log(`删除分组映射成功: ${id}`);
    } catch (error) {
      this.logger.error(`删除分组映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取分组映射
   */
  async getGroupMapping(id: string): Promise<GroupMappingResponseDto> {
    try {
      const mapping = await this.groupMappingRepository.findById(id);
      if (!mapping) {
        throw new GitLabValidationException(`分组映射未找到 ${id}`);
      }
      return this.mapGroupMappingToResponseDto(mapping);
    } catch (error) {
      this.logger.error(`获取分组映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取分组映射列表
   */
  async listGroupMappings(instanceId?: string): Promise<GroupMappingResponseDto[]> {
    try {
      const mappings = instanceId 
        ? await this.groupMappingRepository.findByInstanceId(instanceId)
        : await this.groupMappingRepository.findAll();
      
      return mappings.map(mapping => this.mapGroupMappingToResponseDto(mapping));
    } catch (error) {
      this.logger.error('获取分组映射列表失败', error);
      throw error;
    }
  }

  /**
   * 验证实例配置
   */
  private validateInstanceConfig(dto: CreateGitLabInstanceDto): void {
    if (!dto.name || !dto.baseUrl || !dto.apiToken) {
      throw new GitLabInstanceInvalidConfigException('实例配置不完整');
    }

    // 验证URL格式
    try {
      new URL(dto.baseUrl);
    } catch {
      throw new GitLabInstanceInvalidConfigException('无效的GitLab URL');
    }
  }

  /**
   * 测试实例连接
   */
  private async testInstanceConnection(dto: CreateGitLabInstanceDto): Promise<void> {
    try {
      const testInstance = new GitLabInstance();
      testInstance.baseUrl = dto.baseUrl;
      testInstance.apiToken = dto.apiToken;
      await this.apiClient.testConnection(testInstance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new GitLabInstanceConnectionFailedException(`连接测试失败: ${errorMessage}`);
    }
  }

  /**
   * 清理实例缓存
   */
  private async clearInstanceCache(): Promise<void> {
    await this.cacheService.delete(GitLabCacheKeys.instances());
  }

  /**
   * 清理分组映射缓存
   */
  private async clearGroupMappingCache(instanceId: string): Promise<void> {
    await this.cacheService.delete(GitLabCacheKeys.projectMappings(instanceId));
  }

  /**
   * 映射实例到响应DTO
   */
  private mapInstanceToResponseDto(instance: GitLabInstance): GitLabInstanceResponseDto {
    return {
      id: instance.id,
      name: instance.name,
      baseUrl: instance.baseUrl,
      instanceType: instance.instanceType as any,
      isActive: instance.isActive,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      apiUrl: instance.getApiUrl(),
      webhookUrl: instance.getWebhookUrl(),
      displayName: instance.getDisplayName(),
    };
  }

  /**
   * 映射分组映射到响应DTO
   */
  private mapGroupMappingToResponseDto(mapping: GitLabGroupMapping): GroupMappingResponseDto {
    return {
      id: mapping.id,
      projectId: mapping.projectId,
      instanceId: mapping.gitlabInstanceId,
      gitlabGroupId: mapping.gitlabGroupId.toString(),
      gitlabGroupPath: mapping.gitlabGroupPath,
      syncEnabled: mapping.isActive,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  }
}
