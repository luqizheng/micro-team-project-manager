/**
 * GitLab集成服务接口
 * 定义GitLab集成功能的核心业务接�?
 */

import { CreateGitLabInstanceDto } from '../../presentation/dto/gitlab-instance.dto';
import { UpdateGitLabInstanceDto } from '../../presentation/dto/gitlab-instance.dto';
import { CreateGroupMappingDto } from '../../presentation/dto/gitlab-group-mapping.dto';
import { UpdateGroupMappingDto } from '../../presentation/dto/gitlab-group-mapping.dto';
import { GitLabInstanceResponseDto } from '../../presentation/dto/gitlab-instance.dto';
import { GroupMappingResponseDto } from '../../presentation/dto/gitlab-group-mapping.dto';

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
   * 创建分组映射
   * @param dto 创建分组映射DTO
   * @returns 分组映射响应DTO
   */
  createGroupMapping(dto: CreateGroupMappingDto): Promise<GroupMappingResponseDto>;

  /**
   * 更新分组映射
   * @param id 映射ID
   * @param dto 更新分组映射DTO
   * @returns 分组映射响应DTO
   */
  updateGroupMapping(id: string, dto: UpdateGroupMappingDto): Promise<GroupMappingResponseDto>;

  /**
   * 删除分组映射
   * @param id 映射ID
   */
  deleteGroupMapping(id: string): Promise<void>;

  /**
   * 获取分组映射
   * @param id 映射ID
   * @returns 分组映射响应DTO
   */
  getGroupMapping(id: string): Promise<GroupMappingResponseDto>;

  /**
   * 获取分组映射列表
   * @param instanceId 实例ID（可选）
   * @returns 分组映射响应DTO列表
   */
  listGroupMappings(instanceId?: string): Promise<GroupMappingResponseDto[]>;
}
