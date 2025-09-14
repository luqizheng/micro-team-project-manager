/**
 * GitLab用户映射仓储
 * 负责GitLab用户映射的数据访问
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabUserMapping } from '../../core/entities/gitlab-user-mapping.entity';
import { IGitLabUserMappingRepository } from '../../core/interfaces/gitlab-repository.interface';

/**
 * GitLab用户映射仓储实现
 * 提供GitLab用户映射的数据访问功能
 */
@Injectable()
export class GitLabUserMappingRepository implements IGitLabUserMappingRepository {
  private readonly logger = new Logger(GitLabUserMappingRepository.name);

  constructor(
    @InjectRepository(GitLabUserMapping)
    private readonly repository: Repository<GitLabUserMapping>,
  ) {}

  /**
   * 根据ID查找用户映射
   */
  async findById(id: string): Promise<GitLabUserMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { id },
        relations: ['gitlabInstance', 'user'],
      });
      
      this.logger.debug(`查找用户映射: ${id}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`查找用户映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据实例ID查找用户映射
   */
  async findByInstanceId(instanceId: string): Promise<GitLabUserMapping[]> {
    try {
      const mappings = await this.repository.find({
        where: { gitlabInstance: { id: instanceId } },
        relations: ['gitlabInstance', 'user'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`根据实例ID查找用户映射: ${instanceId}, 结果数量: ${mappings.length}`);
      return mappings;
    } catch (error) {
      this.logger.error(`根据实例ID查找用户映射失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 根据用户ID查找用户映射
   */
  async findByUserId(userId: string): Promise<GitLabUserMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { user: { id: userId } },
        relations: ['gitlabInstance', 'user'],
      });
      
      this.logger.debug(`根据用户ID查找用户映射: ${userId}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`根据用户ID查找用户映射失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 保存用户映射
   */
  async save(mapping: GitLabUserMapping): Promise<GitLabUserMapping> {
    try {
      const savedMapping = await this.repository.save(mapping);
      this.logger.debug(`保存用户映射: ${savedMapping.id}`);
      return savedMapping;
    } catch (error) {
      this.logger.error(`保存用户映射失败: ${mapping.id}`, error);
      throw error;
    }
  }

  /**
   * 更新用户映射
   */
  async update(id: string, mapping: Partial<GitLabUserMapping>): Promise<GitLabUserMapping> {
    try {
      const existingMapping = await this.findById(id);
      if (!existingMapping) {
        throw new Error(`用户映射未找到: ${id}`);
      }

      await this.repository.update(id, mapping);
      const updatedMapping = await this.findById(id);
      
      this.logger.debug(`更新用户映射: ${id}`);
      return updatedMapping!;
    } catch (error) {
      this.logger.error(`更新用户映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除用户映射
   */
  async delete(id: string): Promise<void> {
    try {
      const existingMapping = await this.findById(id);
      if (!existingMapping) {
        throw new Error(`用户映射未找到: ${id}`);
      }

      await this.repository.delete(id);
      this.logger.debug(`删除用户映射: ${id}`);
    } catch (error) {
      this.logger.error(`删除用户映射失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据GitLab用户ID查找用户映射
   */
  async findByGitLabUserId(instanceId: string, gitlabUserId: string): Promise<GitLabUserMapping | null> {
    try {
      const mapping = await this.repository.findOne({
        where: { 
          gitlabInstance: { id: instanceId },
          gitlabUserId: parseInt(gitlabUserId, 10),
        },
        relations: ['gitlabInstance', 'user'],
      });
      
      this.logger.debug(`根据GitLab用户ID查找用户映射: ${instanceId}:${gitlabUserId}, 结果: ${mapping ? '找到' : '未找到'}`);
      return mapping;
    } catch (error) {
      this.logger.error(`根据GitLab用户ID查找用户映射失败: ${instanceId}:${gitlabUserId}`, error);
      throw error;
    }
  }

  /**
   * 检查用户映射是否已存在
   */
  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ 
        where: { user: { id: userId } } 
      });
      const exists = count > 0;
      
      this.logger.debug(`检查用户映射是否存在: ${userId}, 结果: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`检查用户映射是否存在失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 检查GitLab用户映射是否已存在
   */
  async existsByGitLabUserId(instanceId: string, gitlabUserId: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ 
        where: { 
          gitlabInstance: { id: instanceId },
          gitlabUserId: parseInt(gitlabUserId, 10),
        } 
      });
      const exists = count > 0;
      
      this.logger.debug(`检查GitLab用户映射是否存在: ${instanceId}:${gitlabUserId}, 结果: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`检查GitLab用户映射是否存在失败: ${instanceId}:${gitlabUserId}`, error);
      throw error;
    }
  }

  /**
   * 统计用户映射数量
   */
  async count(): Promise<number> {
    try {
      const count = await this.repository.count();
      this.logger.debug(`统计用户映射数量: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('统计用户映射数量失败', error);
      throw error;
    }
  }

  /**
   * 根据实例ID统计用户映射数量
   */
  async countByInstanceId(instanceId: string): Promise<number> {
    try {
      const count = await this.repository.count({ 
        where: { gitlabInstance: { id: instanceId } } 
      });
      this.logger.debug(`根据实例ID统计用户映射数量: ${instanceId}, 结果: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`根据实例ID统计用户映射数量失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 批量保存用户映射
   */
  async saveMany(mappings: GitLabUserMapping[]): Promise<GitLabUserMapping[]> {
    try {
      const savedMappings = await this.repository.save(mappings);
      this.logger.debug(`批量保存用户映射: ${savedMappings.length} 个`);
      return savedMappings;
    } catch (error) {
      this.logger.error(`批量保存用户映射失败: ${mappings.length} 个`, error);
      throw error;
    }
  }

  /**
   * 批量删除用户映射
   */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await this.repository.delete(ids);
      this.logger.debug(`批量删除用户映射: ${ids.length} 个`);
    } catch (error) {
      this.logger.error(`批量删除用户映射失败: ${ids.length} 个`, error);
      throw error;
    }
  }

  /**
   * 根据实例ID删除所有用户映射
   */
  async deleteByInstanceId(instanceId: string): Promise<void> {
    try {
      await this.repository.delete({ gitlabInstance: { id: instanceId } });
      this.logger.debug(`根据实例ID删除所有用户映射: ${instanceId}`);
    } catch (error) {
      this.logger.error(`根据实例ID删除所有用户映射失败: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * 根据用户ID删除用户映射
   */
  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.repository.delete({ user: { id: userId } });
      this.logger.debug(`根据用户ID删除用户映射: ${userId}`);
    } catch (error) {
      this.logger.error(`根据用户ID删除用户映射失败: ${userId}`, error);
      throw error;
    }
  }
}
