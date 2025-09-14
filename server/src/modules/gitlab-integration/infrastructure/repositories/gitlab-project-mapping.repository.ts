/**
 * GitLab项目映射仓储
 * 负责GitLab项目映射的数据访问
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabProjectMapping } from '../../core/entities/gitlab-project-mapping.entity';
import { IGitLabProjectMappingRepository } from '../../core/interfaces/gitlab-repository.interface';
import { GitLabInstanceNotFoundException } from '../../shared/exceptions/gitlab-instance.exception';

/**
 * GitLab项目映射仓储实现
 * 提供GitLab项目映射的数据访问功能
 */
@Injectable()
export class GitLabProjectMappingRepository implements IGitLabProjectMappingRepository {
  private readonly logger = new Logger(GitLabProjectMappingRepository.name);

  constructor(
    @InjectRepository(GitLabProjectMapping)
    private readonly repository: Repository<GitLabProjectMapping>,
  ) {}

  /**
   * 根据ID查找项目映射
   */
  async findById(id: string): Promise<GitLabProjectMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { id },
        relations: ['gitlabInstance', 'project'],
      });
      
      this.logger.debug(`查找项目映射: ${id}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`查找项目映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据实例ID查找项目映射
   */
  async findByInstanceId(instanceId: string): Promise<GitLabProjectMapping[]> {
    try {
      const mappings = await this.repository.find({
        where: { gitlabInstance: { id: instanceId } },
        relations: ['gitlabInstance', 'project'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`根据实例ID查找项目映射: ${instanceId}, 结果数量: ${mappings.length}`);
      return mappings;
    } catch (error) {
      this.logger.error(`根据实例ID查找项目映射失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 根据项目ID查找项目映射
   */
  async findByProjectId(projectId: string): Promise<GitLabProjectMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { project: { id: projectId } },
        relations: ['gitlabInstance', 'project'],
      });
      
      this.logger.debug(`根据项目ID查找项目映射: ${projectId}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`根据项目ID查找项目映射失败: ${projectId}`, error);
      throw error;
    }
  }

  /**
   * 保存项目映射
   */
  async save(mapping: GitLabProjectMapping): Promise<GitLabProjectMapping> {
    try {
      const savedMapping = await this.repository.save(mapping);
      this.logger.debug(`保存项目映射: ${savedMapping.id}`);
      return savedMapping;
    } catch (error) {
      this.logger.error(`保存项目映射失败: ${mapping.id}`, error);
      throw error;
    }
  }

  /**
   * 更新项目映射
   */
  async update(id: string, mapping: Partial<GitLabProjectMapping>): Promise<GitLabProjectMapping> {
    try {
      const existingMapping = await this.findById(id);
      if (!existingMapping) {
        throw new Error(`项目映射未找到: ${id}`);
      }

      await this.repository.update(id, mapping);
      const updatedMapping = await this.findById(id);
      
      this.logger.debug(`更新项目映射: ${id}`);
      return updatedMapping!;
    } catch (error) {
      this.logger.error(`更新项目映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除项目映射
   */
  async delete(id: string): Promise<void> {
    try {
      const existingMapping = await this.findById(id);
      if (!existingMapping) {
        throw new Error(`项目映射未找到: ${id}`);
      }

      await this.repository.delete(id);
      this.logger.debug(`删除项目映射: ${id}`);
    } catch (error) {
      this.logger.error(`删除项目映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 检查项目映射是否存在
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { id } });
      const exists = count > 0;
      
      this.logger.debug(`检查项目映射存在性: ${id}, 结果: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`检查项目映射存在性失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据GitLab项目ID查找项目映射
   */
  async findByGitLabProjectId(instanceId: string, gitlabProjectId: string): Promise<GitLabProjectMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { 
          gitlabInstance: { id: instanceId },
          gitlabProjectId: parseInt(gitlabProjectId, 10),
        },
        relations: ['gitlabInstance', 'project'],
      });
      
      this.logger.debug(`根据GitLab项目ID查找项目映射: ${instanceId}:${gitlabProjectId}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`根据GitLab项目ID查找项目映射失败: ${instanceId}:${gitlabProjectId}`, error);
      throw error;
    }
  }

  /**
   * 检查项目映射是否已存在
   */
  async existsByProjectId(projectId: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ 
        where: { project: { id: projectId } } 
      });
      const exists = count > 0;
      
      this.logger.debug(`检查项目映射是否存在: ${projectId}, 结果: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`检查项目映射是否存在失败: ${projectId}`, error);
      throw error;
    }
  }

  /**
   * 检查GitLab项目映射是否已存在
   */
  async existsByGitLabProjectId(instanceId: string, gitlabProjectId: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ 
        where: { 
          gitlabInstance: { id: instanceId },
          gitlabProjectId: parseInt(gitlabProjectId, 10),
        } 
      });
      const exists = count > 0;
      
      this.logger.debug(`检查GitLab项目映射是否存在: ${instanceId}:${gitlabProjectId}, 结果: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`检查GitLab项目映射是否存在失败: ${instanceId}:${gitlabProjectId}`, error);
      throw error;
    }
  }

  /**
   * 统计项目映射数量
   */
  async count(): Promise<number> {
    try {
      const count = await this.repository.count();
      this.logger.debug(`统计项目映射数量: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('统计项目映射数量失败', error);
      throw error;
    }
  }

  /**
   * 根据实例ID统计项目映射数量
   */
  async countByInstanceId(instanceId: string): Promise<number> {
    try {
      const count = await this.repository.count({ 
        where: { gitlabInstance: { id: instanceId } } 
      });
      this.logger.debug(`根据实例ID统计项目映射数量: ${instanceId}, 结果: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`根据实例ID统计项目映射数量失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 批量保存项目映射
   */
  async saveMany(mappings: GitLabProjectMapping[]): Promise<GitLabProjectMapping[]> {
    try {
      const savedMappings = await this.repository.save(mappings);
      this.logger.debug(`批量保存项目映射: ${savedMappings.length} 个`);
      return savedMappings;
    } catch (error) {
      this.logger.error(`批量保存项目映射失败: ${mappings.length} 个`, error);
      throw error;
    }
  }

  /**
   * 批量删除项目映射
   */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await this.repository.delete(ids);
      this.logger.debug(`批量删除项目映射: ${ids.length} 个`);
    } catch (error) {
      this.logger.error(`批量删除项目映射失败: ${ids.length} 个`, error);
      throw error;
    }
  }

  /**
   * 根据实例ID删除所有项目映射
   */
  async deleteByInstanceId(instanceId: string): Promise<void> {
    try {
      await this.repository.delete({ gitlabInstance: { id: instanceId } });
      this.logger.debug(`根据实例ID删除所有项目映射: ${instanceId}`);
    } catch (error) {
      this.logger.error(`根据实例ID删除所有项目映射失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 根据项目ID删除项目映射
   */
  async deleteByProjectId(projectId: string): Promise<void> {
    try {
      await this.repository.delete({ project: { id: projectId } });
      this.logger.debug(`根据项目ID删除项目映射: ${projectId}`);
    } catch (error) {
      this.logger.error(`根据项目ID删除项目映射失败: ${projectId}`, error);
      throw error;
    }
  }
}
