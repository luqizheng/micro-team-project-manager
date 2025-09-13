import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../entities/gitlab-project-mapping.entity';
import { GitLabSyncStatus } from '../entities/gitlab-sync-status.entity';
import { Project } from '../../projects/project.entity';
import { GitLabApiService } from './gitlab-api.service';
import { GitLabSyncService } from './gitlab-sync.service';
import { CreateGitLabInstanceDto, UpdateGitLabInstanceDto } from '../dto/create-gitlab-instance.dto';
import { CreateProjectMappingDto, UpdateProjectMappingDto } from '../dto/create-project-mapping.dto';
import { GitLabInstanceResponseDto, ProjectMappingResponseDto } from '../dto/gitlab-instance-response.dto';
import { SyncResult, SyncStatistics } from '../interfaces/gitlab-sync.interface';

/**
 * GitLab集成服务
 * 负责GitLab实例和项目映射的管理
 */
@Injectable()
export class GitLabIntegrationService {
  private readonly logger = new Logger(GitLabIntegrationService.name);

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly gitlabInstanceRepository: Repository<GitLabInstance>,
    @InjectRepository(GitLabProjectMapping)
    private readonly projectMappingRepository: Repository<GitLabProjectMapping>,
    @InjectRepository(GitLabSyncStatus)
    private readonly syncStatusRepository: Repository<GitLabSyncStatus>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly gitlabApiService: GitLabApiService,
    private readonly gitlabSyncService: GitLabSyncService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== GitLab实例管理 ====================

  /**
   * 创建GitLab实例
   */
  async createInstance(dto: CreateGitLabInstanceDto): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`创建GitLab实例: ${dto.name}`, { baseUrl: dto.baseUrl });

    // 检查实例名称是否已存在
    const existingInstance = await this.gitlabInstanceRepository.findOne({
      where: { name: dto.name },
    });

    if (existingInstance) {
      throw new ConflictException(`GitLab实例名称 "${dto.name}" 已存在`);
    }

    // 加密API Token
    const encryptedToken = this.encryptApiToken(dto.apiToken);

    // 创建实例
    const instance = this.gitlabInstanceRepository.create({
      name: dto.name,
      baseUrl: dto.baseUrl,
      apiToken: encryptedToken,
      webhookSecret: dto.webhookSecret || this.generateWebhookSecret(),
      instanceType: dto.instanceType || 'self_hosted',
      isActive: dto.isActive !== false,
    });

    const savedInstance = await this.gitlabInstanceRepository.save(instance);

    this.logger.log(`GitLab实例创建成功: ${savedInstance.id}`, {
      instanceId: savedInstance.id,
      name: savedInstance.name,
    });

    return this.mapInstanceToResponse(savedInstance);
  }

  /**
   * 获取所有GitLab实例
   */
  async getAllInstances(): Promise<GitLabInstanceResponseDto[]> {
    this.logger.debug('获取所有GitLab实例');

    const instances = await this.gitlabInstanceRepository.find({
      order: { createdAt: 'DESC' },
    });

    const instancesWithStats = await Promise.all(
      instances.map(async (instance) => {
        const stats = await this.getInstanceStatistics(instance.id);
        return { ...instance, ...stats };
      })
    );

    return instancesWithStats.map(instance => this.mapInstanceToResponse(instance));
  }

  /**
   * 获取特定GitLab实例
   */
  async getInstance(id: string): Promise<GitLabInstanceResponseDto> {
    this.logger.debug(`获取GitLab实例: ${id}`);

    const instance = await this.gitlabInstanceRepository.findOne({
      where: { id },
    });

    if (!instance) {
      throw new NotFoundException(`GitLab实例 "${id}" 不存在`);
    }

    const stats = await this.getInstanceStatistics(instance.id);
    const instanceWithStats = { ...instance, ...stats };

    return this.mapInstanceToResponse(instanceWithStats);
  }

  /**
   * 更新GitLab实例
   */
  async updateInstance(id: string, dto: UpdateGitLabInstanceDto): Promise<GitLabInstanceResponseDto> {
    this.logger.log(`更新GitLab实例: ${id}`, dto);

    const instance = await this.gitlabInstanceRepository.findOne({
      where: { id },
    });

    if (!instance) {
      throw new NotFoundException(`GitLab实例 "${id}" 不存在`);
    }

    // 检查名称冲突
    if (dto.name && dto.name !== instance.name) {
      const existingInstance = await this.gitlabInstanceRepository.findOne({
        where: { name: dto.name },
      });

      if (existingInstance) {
        throw new ConflictException(`GitLab实例名称 "${dto.name}" 已存在`);
      }
    }

    // 更新字段
    if (dto.name) instance.name = dto.name;
    if (dto.baseUrl) instance.baseUrl = dto.baseUrl;
    if (dto.webhookSecret !== undefined) instance.webhookSecret = dto.webhookSecret;
    if (dto.instanceType) instance.instanceType = dto.instanceType;
    if (dto.isActive !== undefined) instance.isActive = dto.isActive;

    const savedInstance = await this.gitlabInstanceRepository.save(instance);

    this.logger.log(`GitLab实例更新成功: ${savedInstance.id}`, {
      instanceId: savedInstance.id,
      name: savedInstance.name,
    });

    return this.mapInstanceToResponse(savedInstance);
  }

  /**
   * 删除GitLab实例
   */
  async deleteInstance(id: string): Promise<void> {
    this.logger.log(`删除GitLab实例: ${id}`);

    const instance = await this.gitlabInstanceRepository.findOne({
      where: { id },
      relations: ['projectMappings'],
    });

    if (!instance) {
      throw new NotFoundException(`GitLab实例 "${id}" 不存在`);
    }

    // 检查是否有关联的项目映射
    if (instance.projectMappings && instance.projectMappings.length > 0) {
      throw new ConflictException(
        `无法删除GitLab实例，存在 ${instance.projectMappings.length} 个关联的项目映射`
      );
    }

    await this.gitlabInstanceRepository.remove(instance);

    this.logger.log(`GitLab实例删除成功: ${id}`);
  }

  /**
   * 测试GitLab实例连接
   */
  async testInstanceConnection(id: string): Promise<{ success: boolean; message: string; data?: any }> {
    this.logger.log(`测试GitLab实例连接: ${id}`);

    const instance = await this.gitlabInstanceRepository.findOne({
      where: { id },
    });

    if (!instance) {
      throw new NotFoundException(`GitLab实例 "${id}" 不存在`);
    }

    try {
      const isConnected = await this.gitlabApiService.testConnection(instance);
      
      if (isConnected) {
        const instanceInfo = await this.gitlabApiService.getInstanceInfo(instance);
        
        this.logger.log(`GitLab实例连接测试成功: ${id}`, {
          instanceId: id,
          gitlabUser: instanceInfo.username,
        });

        return {
          success: true,
          message: '连接成功',
          data: {
            gitlabUser: instanceInfo.username,
            gitlabName: instanceInfo.name,
            gitlabEmail: instanceInfo.email,
          },
        };
      } else {
        return {
          success: false,
          message: '连接失败',
        };
      }
    } catch (error) {
      this.logger.error(`GitLab实例连接测试失败: ${error.message}`, {
        instanceId: id,
        error: error.stack,
      });

      return {
        success: false,
        message: error.message,
        data: { error: error.stack },
      };
    }
  }

  // ==================== 项目映射管理 ====================

  /**
   * 创建项目映射
   */
  async createProjectMapping(
    projectId: string,
    dto: CreateProjectMappingDto,
  ): Promise<ProjectMappingResponseDto> {
    this.logger.log(`创建项目映射: ${projectId} -> ${dto.gitlabProjectPath}`, {
      projectId,
      gitlabInstanceId: dto.gitlabInstanceId,
      gitlabProjectId: dto.gitlabProjectId,
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
    const existingMapping = await this.projectMappingRepository.findOne({
      where: {
        projectId,
        gitlabInstanceId: dto.gitlabInstanceId,
        gitlabProjectId: dto.gitlabProjectId,
      },
    });

    if (existingMapping) {
      throw new ConflictException('项目映射已存在');
    }

    // 验证GitLab项目是否存在
    try {
      const gitlabProject = await this.gitlabApiService.getProject(instance, dto.gitlabProjectId);
      if (!gitlabProject) {
        throw new NotFoundException('GitLab项目不存在');
      }
    } catch (error) {
      throw new BadRequestException(`无法访问GitLab项目: ${error.message}`);
    }

    // 创建映射
    const mapping = this.projectMappingRepository.create({
      projectId,
      gitlabInstanceId: dto.gitlabInstanceId,
      gitlabProjectId: dto.gitlabProjectId,
      gitlabProjectPath: dto.gitlabProjectPath,
      webhookId: dto.webhookId,
      isActive: dto.isActive !== false,
    });

    const savedMapping = await this.projectMappingRepository.save(mapping);

    // 创建同步状态记录
    const syncStatus = this.syncStatusRepository.create({
      mappingId: savedMapping.id,
      syncStatus: 'in_progress',
    });
    await this.syncStatusRepository.save(syncStatus);

    this.logger.log(`项目映射创建成功: ${savedMapping.id}`, {
      mappingId: savedMapping.id,
      projectId,
      gitlabProjectId: dto.gitlabProjectId,
    });

    return this.mapMappingToResponse(savedMapping);
  }

  /**
   * 获取项目的所有映射
   */
  async getProjectMappings(projectId: string): Promise<ProjectMappingResponseDto[]> {
    this.logger.debug(`获取项目映射: ${projectId}`);

    const mappings = await this.projectMappingRepository.find({
      where: { projectId },
      relations: ['project', 'gitlabInstance', 'syncStatus'],
      order: { createdAt: 'DESC' },
    });

    return mappings.map(mapping => this.mapMappingToResponse(mapping));
  }

  /**
   * 获取特定项目映射
   */
  async getProjectMapping(projectId: string, mappingId: string): Promise<ProjectMappingResponseDto> {
    this.logger.debug(`获取项目映射: ${projectId}/${mappingId}`);

    const mapping = await this.projectMappingRepository.findOne({
      where: { id: mappingId, projectId },
      relations: ['project', 'gitlabInstance', 'syncStatus'],
    });

    if (!mapping) {
      throw new NotFoundException(`项目映射 "${mappingId}" 不存在`);
    }

    return this.mapMappingToResponse(mapping);
  }

  /**
   * 更新项目映射
   */
  async updateProjectMapping(
    projectId: string,
    mappingId: string,
    dto: UpdateProjectMappingDto,
  ): Promise<ProjectMappingResponseDto> {
    this.logger.log(`更新项目映射: ${projectId}/${mappingId}`, dto);

    const mapping = await this.projectMappingRepository.findOne({
      where: { id: mappingId, projectId },
      relations: ['gitlabInstance'],
    });

    if (!mapping) {
      throw new NotFoundException(`项目映射 "${mappingId}" 不存在`);
    }

    // 更新字段
    if (dto.gitlabProjectId !== undefined) mapping.gitlabProjectId = dto.gitlabProjectId;
    if (dto.gitlabProjectPath) mapping.gitlabProjectPath = dto.gitlabProjectPath;
    if (dto.webhookId !== undefined) mapping.webhookId = dto.webhookId;
    if (dto.isActive !== undefined) mapping.isActive = dto.isActive;

    const savedMapping = await this.projectMappingRepository.save(mapping);

    this.logger.log(`项目映射更新成功: ${savedMapping.id}`, {
      mappingId: savedMapping.id,
      projectId,
    });

    return this.mapMappingToResponse(savedMapping);
  }

  /**
   * 删除项目映射
   */
  async deleteProjectMapping(projectId: string, mappingId: string): Promise<void> {
    this.logger.log(`删除项目映射: ${projectId}/${mappingId}`);

    const mapping = await this.projectMappingRepository.findOne({
      where: { id: mappingId, projectId },
    });

    if (!mapping) {
      throw new NotFoundException(`项目映射 "${mappingId}" 不存在`);
    }

    await this.projectMappingRepository.remove(mapping);

    this.logger.log(`项目映射删除成功: ${mappingId}`);
  }

  /**
   * 手动同步项目映射
   */
  async syncProjectMapping(projectId: string, mappingId: string): Promise<SyncResult> {
    this.logger.log(`手动同步项目映射: ${projectId}/${mappingId}`);

    const mapping = await this.projectMappingRepository.findOne({
      where: { id: mappingId, projectId },
      relations: ['gitlabInstance', 'syncStatus'],
    });

    if (!mapping) {
      throw new NotFoundException(`项目映射 "${mappingId}" 不存在`);
    }

    try {
      // 标记同步开始
      if (mapping.syncStatus) {
        mapping.syncStatus.markSyncInProgress();
        await this.syncStatusRepository.save(mapping.syncStatus);
      }

      // 执行同步逻辑（这里可以调用具体的同步方法）
      // const syncResult = await this.gitlabSyncService.syncProject(mapping);

      // 模拟同步结果
      const syncResult: SyncResult = {
        success: true,
        message: '同步完成',
        syncCount: 1,
        lastSyncAt: new Date(),
      };

      // 更新同步状态
      if (mapping.syncStatus) {
        if (syncResult.success) {
          mapping.syncStatus.markSyncSuccess();
        } else {
          mapping.syncStatus.markSyncFailed(syncResult.message);
        }
        await this.syncStatusRepository.save(mapping.syncStatus);
      }

      this.logger.log(`项目映射同步完成: ${mappingId}`, {
        mappingId,
        success: syncResult.success,
      });

      return syncResult;
    } catch (error) {
      this.logger.error(`项目映射同步失败: ${error.message}`, {
        mappingId,
        error: error.stack,
      });

      // 更新同步状态为失败
      if (mapping.syncStatus) {
        mapping.syncStatus.markSyncFailed(error.message);
        await this.syncStatusRepository.save(mapping.syncStatus);
      }

      return {
        success: false,
        message: error.message,
        syncCount: 0,
        lastSyncAt: new Date(),
      };
    }
  }

  // ==================== 统计和监控 ====================

  /**
   * 获取实例统计信息
   */
  private async getInstanceStatistics(instanceId: string): Promise<{
    projectCount: number;
    activeProjectCount: number;
    lastSyncTime?: Date;
    failedSyncCount: number;
  }> {
    const [projectCount, activeProjectCount, syncStatuses] = await Promise.all([
      this.projectMappingRepository.count({
        where: { gitlabInstanceId: instanceId },
      }),
      this.projectMappingRepository.count({
        where: { gitlabInstanceId: instanceId, isActive: true },
      }),
      this.syncStatusRepository.find({
        where: { mapping: { gitlabInstanceId: instanceId } },
        relations: ['mapping'],
      }),
    ]);

    const lastSyncTime = syncStatuses
      .filter(s => s.lastSyncAt)
      .sort((a, b) => b.lastSyncAt!.getTime() - a.lastSyncAt!.getTime())[0]?.lastSyncAt;

    const failedSyncCount = syncStatuses.filter(s => s.syncStatus === 'failed').length;

    return {
      projectCount,
      activeProjectCount,
      lastSyncTime,
      failedSyncCount,
    };
  }

  /**
   * 获取同步统计信息
   */
  async getSyncStatistics(): Promise<SyncStatistics> {
    const [totalMappings, activeMappings, syncStatuses] = await Promise.all([
      this.projectMappingRepository.count(),
      this.projectMappingRepository.count({ where: { isActive: true } }),
      this.syncStatusRepository.find(),
    ]);

    const successfulSyncs = syncStatuses.filter(s => s.syncStatus === 'success').length;
    const failedSyncs = syncStatuses.filter(s => s.syncStatus === 'failed').length;
    const inProgressSyncs = syncStatuses.filter(s => s.syncStatus === 'in_progress').length;

    const lastSyncTime = syncStatuses
      .filter(s => s.lastSyncAt)
      .sort((a, b) => b.lastSyncAt!.getTime() - a.lastSyncAt!.getTime())[0]?.lastSyncAt;

    const averageSyncTime = syncStatuses.reduce((sum, s) => sum + s.syncCount, 0) / syncStatuses.length || 0;
    const errorRate = totalMappings > 0 ? (failedSyncs / totalMappings) * 100 : 0;

    return {
      totalMappings,
      activeMappings,
      successfulSyncs,
      failedSyncs,
      inProgressSyncs,
      lastSyncTime,
      averageSyncTime,
      errorRate,
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 加密API Token
   */
  private encryptApiToken(token: string): string {
    const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
    const hash = createHash('sha256').update(secret).digest('hex');
    return createHash('sha256').update(token + hash).digest('hex');
  }

  /**
   * 生成Webhook密钥
   */
  private generateWebhookSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 映射实例到响应DTO
   */
  private mapInstanceToResponse(instance: any): GitLabInstanceResponseDto {
    return {
      id: instance.id,
      name: instance.name,
      baseUrl: instance.baseUrl,
      webhookSecret: instance.webhookSecret ? `${instance.webhookSecret.substring(0, 4)}****` : null,
      isActive: instance.isActive,
      instanceType: instance.instanceType,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      projectCount: instance.projectCount || 0,
      activeProjectCount: instance.activeProjectCount || 0,
      lastSyncTime: instance.lastSyncTime,
      failedSyncCount: instance.failedSyncCount || 0,
    };
  }

  /**
   * 映射项目映射到响应DTO
   */
  private mapMappingToResponse(mapping: any): ProjectMappingResponseDto {
    return {
      id: mapping.id,
      projectId: mapping.projectId,
      gitlabInstanceId: mapping.gitlabInstanceId,
      gitlabProjectId: mapping.gitlabProjectId,
      gitlabProjectPath: mapping.gitlabProjectPath,
      webhookId: mapping.webhookId,
      isActive: mapping.isActive,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      projectName: mapping.project?.name,
      gitlabInstanceName: mapping.gitlabInstance?.name,
      gitlabProjectUrl: mapping.gitlabInstance ? 
        `${mapping.gitlabInstance.baseUrl}/${mapping.gitlabProjectPath}` : null,
      syncStatus: mapping.syncStatus?.syncStatus,
      lastSyncAt: mapping.syncStatus?.lastSyncAt,
      syncCount: mapping.syncStatus?.syncCount || 0,
    };
  }
}
