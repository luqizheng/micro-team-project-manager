/**
 * GitLab集成服务
 * 负责GitLab实例和项目映射的管理
 */

import { Injectable, Logger } from '@nestjs/common';
import { IGitLabIntegrationService } from '../../core/interfaces/gitlab-integration.interface';
import { IGitLabInstanceRepository } from '../../core/interfaces/gitlab-repository.interface';
import { IGitLabProjectMappingRepository } from '../../core/interfaces/gitlab-repository.interface';
import { IGitLabApiClient } from '../../core/interfaces/gitlab-api.interface';
import { GitLabConfigService } from '../../infrastructure/config/gitlab-config.service';
import { GitLabCacheService } from '../../infrastructure/cache/gitlab-cache.service';
import { GitLabCacheKeys } from '../../infrastructure/cache/gitlab-cache-keys';
import { CreateGitLabInstanceDto, UpdateGitLabInstanceDto, GitLabInstanceResponseDto } from '../../presentation/dto/gitlab-instance.dto';
import { CreateProjectMappingDto, UpdateProjectMappingDto, ProjectMappingResponseDto } from '../../presentation/dto/gitlab-project-mapping.dto';
import { GitLabInstance } from '../../core/entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../../core/entities/gitlab-project-mapping.entity';
import {
  GitLabInstanceNotFoundException,
  GitLabInstanceAlreadyExistsException,
  GitLabInstanceInvalidConfigException,
  GitLabInstanceConnectionFailedException,
} from '../../shared/exceptions/gitlab-instance.exception';
import { GitLabValidationException } from '../../shared/exceptions/gitlab-validation.exception';
import { InstanceType } from '../../core/enums';

/**
 * GitLab集成服务实现
 * 提供GitLab实例和项目映射的管理功能
 */
@Injectable()
export class GitLabIntegrationService implements IGitLabIntegrationService {
  private readonly logger = new Logger(GitLabIntegrationService.name);

  constructor(
    private readonly instanceRepository: IGitLabInstanceRepository,
    private readonly projectMappingRepository: IGitLabProjectMappingRepository,
    private readonly apiClient: IGitLabApiClient,
    private readonly configService: GitLabConfigService,
    private readonly cacheService: GitLabCacheService,
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

      // 创建实例实体
      const instance = new GitLabInstance();
      instance.name = dto.name;
      instance.baseUrl = dto.baseUrl;
      instance.apiToken = dto.apiToken;
      instance.webhookSecret = dto.webhookSecret;
      instance.isActive = dto.isActive ?? true;
      instance.instanceType = dto.instanceType ?? 'self_hosted';

      // 测试连接
      const isConnected = await this.apiClient.testConnection(instance);
      if (!isConnected) {
        throw new GitLabInstanceConnectionFailedException(instance.id, '连接测试失败');
      }

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
      if (dto.baseUrl || dto.apiToken) {
        this.validateInstanceConfig({
          name: dto.name ?? existingInstance.name,
          baseUrl: dto.baseUrl ?? existingInstance.baseUrl,
          apiToken: dto.apiToken ?? existingInstance.apiToken,
          webhookSecret: dto.webhookSecret ?? existingInstance.webhookSecret,
          isActive: dto.isActive ?? existingInstance.isActive,
          instanceType: dto.instanceType ?? existingInstance.instanceType,
        });
      }

      // 检查URL是否重复
      if (dto.baseUrl && dto.baseUrl !== existingInstance.baseUrl) {
        const duplicateInstance = await this.instanceRepository.findByBaseUrl(dto.baseUrl);
        if (duplicateInstance && duplicateInstance.id !== id) {
          throw new GitLabInstanceAlreadyExistsException(dto.baseUrl);
        }
      }

      // 更新实例
      const updatedInstance = await this.instanceRepository.update(id, dto);

      // 清理缓存
      await this.clearInstanceCache();
      await this.clearInstanceSpecificCache(id);

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
      await this.clearInstanceSpecificCache(id);

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
   * 创建项目映射
   */
  async createProjectMapping(dto: CreateProjectMappingDto): Promise<ProjectMappingResponseDto> {
    try {
      // 验证实例是否存在
      const instance = await this.instanceRepository.findById(dto.instanceId);
      if (!instance) {
        throw new GitLabInstanceNotFoundException(dto.instanceId);
      }

      // 检查映射是否已存在
      const existingMapping = await this.projectMappingRepository.findByProjectId(dto.projectId);
      if (existingMapping) {
        throw new GitLabValidationException(`项目映射已存在: ${dto.projectId}`);
      }

      // 创建映射实体
      const mapping = new GitLabProjectMapping();
      mapping.gitlabInstance = instance;
      mapping.projectId = dto.projectId;
      mapping.gitlabProjectId = dto.gitlabProjectId;
      mapping.gitlabProjectPath = dto.gitlabProjectPath || '';
      mapping.isActive = dto.syncEnabled ?? true;

      // 保存映射
      const savedMapping = await this.projectMappingRepository.save(mapping);

      // 清理缓存
      await this.clearProjectMappingCache(dto.instanceId);

      this.logger.log(`创建项目映射成功: ${savedMapping.id}`);
      return this.mapProjectMappingToResponseDto(savedMapping);
    } catch (error) {
      this.logger.error(`创建项目映射失败: ${dto.projectId}`, error);
      throw error;
    }
  }

  /**
   * 更新项目映射
   */
  async updateProjectMapping(id: string, dto: UpdateProjectMappingDto): Promise<ProjectMappingResponseDto> {
    try {
      // 查找映射
      const existingMapping = await this.projectMappingRepository.findById(id);
      if (!existingMapping) {
        throw new GitLabValidationException(`项目映射未找到: ${id}`);
      }

      // 更新映射
      const updatedMapping = await this.projectMappingRepository.update(id, dto);

      // 清理缓存
      await this.clearProjectMappingCache(existingMapping.gitlabInstance.id);

      this.logger.log(`更新项目映射成功: ${id}`);
      return this.mapProjectMappingToResponseDto(updatedMapping);
    } catch (error) {
      this.logger.error(`更新项目映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除项目映射
   */
  async deleteProjectMapping(id: string): Promise<void> {
    try {
      // 查找映射
      const existingMapping = await this.projectMappingRepository.findById(id);
      if (!existingMapping) {
        throw new GitLabValidationException(`项目映射未找到: ${id}`);
      }

      // 删除映射
      await this.projectMappingRepository.delete(id);

      // 清理缓存
      await this.clearProjectMappingCache(existingMapping.gitlabInstance.id);

      this.logger.log(`删除项目映射成功: ${id}`);
    } catch (error) {
      this.logger.error(`删除项目映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取项目映射
   */
  async getProjectMapping(id: string): Promise<ProjectMappingResponseDto> {
    try {
      const mapping = await this.projectMappingRepository.findById(id);
      if (!mapping) {
        throw new GitLabValidationException(`项目映射未找到: ${id}`);
      }

      return this.mapProjectMappingToResponseDto(mapping);
    } catch (error) {
      this.logger.error(`获取项目映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 获取项目映射列表
   */
  async listProjectMappings(instanceId?: string): Promise<ProjectMappingResponseDto[]> {
    try {
      let mappings: GitLabProjectMapping[];
      
      if (instanceId) {
        mappings = await this.projectMappingRepository.findByInstanceId(instanceId);
      } else {
        // 获取所有映射
        const allInstances = await this.instanceRepository.findAll();
        const allMappings: GitLabProjectMapping[] = [];
        
        for (const instance of allInstances) {
          const instanceMappings = await this.projectMappingRepository.findByInstanceId(instance.id);
          allMappings.push(...instanceMappings);
        }
        
        mappings = allMappings;
      }

      return mappings.map(mapping => this.mapProjectMappingToResponseDto(mapping));
    } catch (error) {
      this.logger.error(`获取项目映射列表失败: ${instanceId || 'all'}`, error);
      throw error;
    }
  }

  /**
   * 验证实例配置
   */
  private validateInstanceConfig(dto: any): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new GitLabInstanceInvalidConfigException('实例名称不能为空');
    }

    if (!dto.baseUrl || dto.baseUrl.trim().length === 0) {
      throw new GitLabInstanceInvalidConfigException('实例URL不能为空');
    }

    if (!dto.apiToken || dto.apiToken.trim().length === 0) {
      throw new GitLabInstanceInvalidConfigException('API Token不能为空');
    }

    // 验证URL格式
    try {
      new URL(dto.baseUrl);
    } catch {
      throw new GitLabInstanceInvalidConfigException('实例URL格式无效');
    }

    // 验证名称长度
    if (dto.name.length > 100) {
      throw new GitLabInstanceInvalidConfigException('实例名称长度不能超过100个字符');
    }

    // 验证URL长度
    if (dto.baseUrl.length > 500) {
      throw new GitLabInstanceInvalidConfigException('实例URL长度不能超过500个字符');
    }
  }

  /**
   * 映射实例实体到响应DTO
   */
  private mapInstanceToResponseDto(instance: GitLabInstance): GitLabInstanceResponseDto {
    const baseUrl = instance.baseUrl.endsWith('/') 
      ? instance.baseUrl.slice(0, -1) 
      : instance.baseUrl;
    
    return {
      id: instance.id,
      name: instance.name,
      baseUrl: instance.baseUrl,
      isActive: instance.isActive,
      instanceType: instance.instanceType as InstanceType,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      apiUrl: `${baseUrl}/api/v4`,
      webhookUrl: `${baseUrl}/api/v4/projects/:id/hooks`,
      displayName: `${instance.name} (${instance.baseUrl})`,
    };
  }

  /**
   * 映射项目映射实体到响应DTO
   */
  private mapProjectMappingToResponseDto(mapping: GitLabProjectMapping): ProjectMappingResponseDto {
    return {
      id: mapping.id,
      instanceId: mapping.gitlabInstance.id,
      projectId: mapping.projectId,
      gitlabProjectId: mapping.gitlabProjectId.toString(),
      gitlabProjectPath: mapping.gitlabProjectPath,
      syncEnabled: mapping.isActive,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    };
  }

  /**
   * 清理实例缓存
   */
  private async clearInstanceCache(): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      await this.cacheService.delete(GitLabCacheKeys.instances());
    }
  }

  /**
   * 清理特定实例的缓存
   */
  private async clearInstanceSpecificCache(instanceId: string): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      // 清理实例相关缓存
      await this.cacheService.delete(GitLabCacheKeys.instance(instanceId));
      await this.cacheService.delete(GitLabCacheKeys.projects(instanceId));
      await this.cacheService.delete(GitLabCacheKeys.users(instanceId));
      await this.cacheService.delete(GitLabCacheKeys.syncStatus(instanceId));
      await this.cacheService.delete(GitLabCacheKeys.syncHistory(instanceId));
    }
  }

  /**
   * 清理项目映射缓存
   */
  private async clearProjectMappingCache(instanceId: string): Promise<void> {
    if (this.configService.isCacheEnabled()) {
      await this.cacheService.delete(GitLabCacheKeys.projectMappings(instanceId));
    }
  }
}
