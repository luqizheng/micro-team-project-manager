/**
 * GitLab分组映射仓储
 * 负责GitLab分组映射的数据访问
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabGroupMapping } from '../../core/entities/gitlab-group-mapping.entity';
import { IGitLabGroupMappingRepository } from '../../core/interfaces/gitlab-repository.interface';

/**
 * GitLab分组映射仓储实现
 * 提供GitLab分组映射的数据访问功能
 */
@Injectable()
export class GitLabGroupMappingRepository implements IGitLabGroupMappingRepository {
  private readonly logger = new Logger(GitLabGroupMappingRepository.name);

  constructor(
    @InjectRepository(GitLabGroupMapping)
    private readonly repository: Repository<GitLabGroupMapping>,
  ) {}

  /**
   * 根据ID查找分组映射
   */
  async findById(id: string): Promise<GitLabGroupMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { id },
        relations: ['gitlabInstance', 'project'],
      });
      
      this.logger.debug(`根据ID查找分组映射: ${id}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`根据ID查找分组映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据实例ID查找分组映射
   */
  async findByInstanceId(instanceId: string): Promise<GitLabGroupMapping[]> {
    try {
      const mappings = await this.repository.find({
        where: { 
          gitlabInstance: { id: instanceId },
          isActive: true,
        },
        relations: ['gitlabInstance', 'project'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`根据实例ID查找分组映射: ${instanceId}, 结果: ${mappings.length}个`);
      return mappings;
    } catch (error) {
      this.logger.error(`根据实例ID查找分组映射失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 根据项目ID查找分组映射
   */
  async findByProjectId(projectId: string): Promise<GitLabGroupMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { 
          projectId,
          isActive: true,
        },
        relations: ['gitlabInstance', 'project'],
      });
      
      this.logger.debug(`根据项目ID查找分组映射: ${projectId}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`根据项目ID查找分组映射失败: ${projectId}`, error);
      throw error;
    }
  }

  /**
   * 查找所有分组映射
   */
  async findAll(): Promise<GitLabGroupMapping[]> {
    try {
      const mappings = await this.repository.find({
        where: { isActive: true },
        relations: ['gitlabInstance', 'project'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`查找所有分组映射 结果: ${mappings.length}个`);
      return mappings;
    } catch (error) {
      this.logger.error('查找所有分组映射失败', error);  
      throw error;
    }
  }

  /**
   * 保存分组映射
   */
  async save(mapping: GitLabGroupMapping): Promise<GitLabGroupMapping> {
    try {
      const savedMapping = await this.repository.save(mapping);
      this.logger.debug(`保存分组映射成功: ${savedMapping.id}`);
      return savedMapping;
    } catch (error) {
      this.logger.error(`保存分组映射失败: ${mapping.id}`, error);
      throw error;
    }
  }

  /**
   * 更新分组映射
   */
  async update(id: string, mapping: Partial<GitLabGroupMapping>): Promise<GitLabGroupMapping> {
    try {
      await this.repository.update(id, mapping);
      const updatedMapping = await this.findById(id);
      if (!updatedMapping) {
        throw new Error(`更新后无法找到分组映射 ${id}`);
      }
      
      this.logger.debug(`更新分组映射成功: ${id}`);
      return updatedMapping;
    } catch (error) {
      this.logger.error(`更新分组映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除分组映射
   */
  async delete(id: string): Promise<void> {
    try {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        throw new Error(`分组映射不存在 ${id}`);
      }
      
      this.logger.debug(`删除分组映射成功: ${id}`);
    } catch (error) {
      this.logger.error(`删除分组映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 检查分组映射是否存�?
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { id } });
      return count > 0;
    } catch (error) {
      this.logger.error(`检查分组映射存在性失败 ${id}`, error);
      throw error;
    }
  }
}
