/**
 * GitLab集成服务接口
 * 定义GitLab集成功能的核心业务接口
 */

import { CreateGitLabInstanceDto } from '../../presentation/dto/create-gitlab-instance.dto';
import { UpdateGitLabInstanceDto } from '../../presentation/dto/update-gitlab-instance.dto';
import { CreateProjectMappingDto } from '../../presentation/dto/create-project-mapping.dto';
import { UpdateProjectMappingDto } from '../../presentation/dto/update-project-mapping.dto';
import { GitLabInstanceResponseDto } from '../../presentation/dto/gitlab-instance-response.dto';
import { ProjectMappingResponseDto } from '../../presentation/dto/project-mapping-response.dto';

/**
 * GitLab集成服务接口
 * 负责GitLab实例和项目映射的管理
 */
export interface IGitLabIntegrationService {
  /**
   * 创建GitLab实例
   * @param dto 创建实例DTO
   * @returns 实例响应DTO
   */
  createInstance(dto: CreateGitLabInstanceDto): Promise<GitLabInstanceResponseDto>;

  /**
   * 更新GitLab实例
   * @param id 实例ID
   * @param dto 更新实例DTO
   * @returns 实例响应DTO
   */
  updateInstance(id: string, dto: UpdateGitLabInstanceDto): Promise<GitLabInstanceResponseDto>;

  /**
   * 删除GitLab实例
   * @param id 实例ID
   */
  deleteInstance(id: string): Promise<void>;

  /**
   * 获取GitLab实例
   * @param id 实例ID
   * @returns 实例响应DTO
   */
  getInstance(id: string): Promise<GitLabInstanceResponseDto>;

  /**
   * 获取所有GitLab实例
   * @returns 实例响应DTO列表
   */
  listInstances(): Promise<GitLabInstanceResponseDto[]>;

  /**
   * 创建项目映射
   * @param dto 创建项目映射DTO
   * @returns 项目映射响应DTO
   */
  createProjectMapping(dto: CreateProjectMappingDto): Promise<ProjectMappingResponseDto>;

  /**
   * 更新项目映射
   * @param id 映射ID
   * @param dto 更新项目映射DTO
   * @returns 项目映射响应DTO
   */
  updateProjectMapping(id: string, dto: UpdateProjectMappingDto): Promise<ProjectMappingResponseDto>;

  /**
   * 删除项目映射
   * @param id 映射ID
   */
  deleteProjectMapping(id: string): Promise<void>;

  /**
   * 获取项目映射
   * @param id 映射ID
   * @returns 项目映射响应DTO
   */
  getProjectMapping(id: string): Promise<ProjectMappingResponseDto>;

  /**
   * 获取项目映射列表
   * @param instanceId 实例ID（可选）
   * @returns 项目映射响应DTO列表
   */
  listProjectMappings(instanceId?: string): Promise<ProjectMappingResponseDto[]>;
}
