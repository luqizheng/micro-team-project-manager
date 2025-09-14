/**
 * GitLab实例仓储
 * 负责GitLab实例的数据访问
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabInstance } from '../../core/entities/gitlab-instance.entity';
import { IGitLabInstanceRepository } from '../../core/interfaces/gitlab-repository.interface';
import { GitLabInstanceNotFoundException } from '../../shared/exceptions/gitlab-instance.exception';

/**
 * GitLab实例仓储实现
 * 提供GitLab实例的数据访问功能
 */
@Injectable()
export class GitLabInstanceRepository implements IGitLabInstanceRepository {
  private readonly logger = new Logger(GitLabInstanceRepository.name);

  constructor(
    @InjectRepository(GitLabInstance)
    private readonly repository: Repository<GitLabInstance>,
  ) {}

  /**
   * 根据ID查找实例
   */
  async findById(id: string): Promise<GitLabInstance | null> {
    try {
      const instance = await this.repository.findOne({
        where: { id },
        relations: ['projectMappings', 'userMappings', 'eventLogs'],
      });
      
      this.logger.debug(`查找实例: ${id}, 结果: ${instance ? '找到' : '未找到'}`);
      return instance;
    } catch (error) {
      this.logger.error(`查找实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 查找所有实例
   */
  async findAll(): Promise<GitLabInstance[]> {
    try {
      const instances = await this.repository.find({
        relations: ['projectMappings', 'userMappings', 'eventLogs'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`查找所有实例, 结果数量: ${instances.length}`);
      return instances;
    } catch (error) {
      this.logger.error('查找所有实例失败', error);
      throw error;
    }
  }

  /**
   * 根据基础URL查找实例
   */
  async findByBaseUrl(baseUrl: string): Promise<GitLabInstance | null> {
    try {
      const instance = await this.repository.findOne({
        where: { baseUrl },
        relations: ['projectMappings', 'userMappings', 'eventLogs'],
      });
      
      this.logger.debug(`根据URL查找实例: ${baseUrl}, 结果: ${instance ? '找到' : '未找到'}`);
      return instance;
    } catch (error) {
      this.logger.error(`根据URL查找实例失败: ${baseUrl}`, error);
      throw error;
    }
  }

  /**
   * 保存实例
   */
  async save(instance: GitLabInstance): Promise<GitLabInstance> {
    try {
      const savedInstance = await this.repository.save(instance);
      this.logger.debug(`保存实例: ${savedInstance.id}`);
      return savedInstance;
    } catch (error) {
      this.logger.error(`保存实例失败: ${instance.id}`, error);
      throw error;
    }
  }

  /**
   * 更新实例
   */
  async update(id: string, instance: Partial<GitLabInstance>): Promise<GitLabInstance> {
    try {
      const existingInstance = await this.findById(id);
      if (!existingInstance) {
        throw new GitLabInstanceNotFoundException(id);
      }

      await this.repository.update(id, instance);
      const updatedInstance = await this.findById(id);
      
      this.logger.debug(`更新实例: ${id}`);
      return updatedInstance!;
    } catch (error) {
      this.logger.error(`更新实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 删除实例
   */
  async delete(id: string): Promise<void> {
    try {
      const existingInstance = await this.findById(id);
      if (!existingInstance) {
        throw new GitLabInstanceNotFoundException(id);
      }

      await this.repository.delete(id);
      this.logger.debug(`删除实例: ${id}`);
    } catch (error) {
      this.logger.error(`删除实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 检查实例是否存在
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { id } });
      const exists = count > 0;
      
      this.logger.debug(`检查实例存在性: ${id}, 结果: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`检查实例存在性失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 根据状态查找实例
   */
  async findByStatus(isActive: boolean): Promise<GitLabInstance[]> {
    try {
      const instances = await this.repository.find({
        where: { isActive },
        relations: ['projectMappings', 'userMappings', 'eventLogs'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`根据状态查找实例: ${isActive}, 结果数量: ${instances.length}`);
      return instances;
    } catch (error) {
      this.logger.error(`根据状态查找实例失败: ${isActive}`, error);
      throw error;
    }
  }

  /**
   * 根据类型查找实例
   */
  async findByType(instanceType: 'self_hosted' | 'gitlab_com'): Promise<GitLabInstance[]> {
    try {
      const instances = await this.repository.find({
        where: { instanceType },
        relations: ['projectMappings', 'userMappings', 'eventLogs'],
        order: { createdAt: 'DESC' },
      });
      
      this.logger.debug(`根据类型查找实例: ${instanceType}, 结果数量: ${instances.length}`);
      return instances;
    } catch (error) {
      this.logger.error(`根据类型查找实例失败: ${instanceType}`, error);
      throw error;
    }
  }

  /**
   * 统计实例数量
   */
  async count(): Promise<number> {
    try {
      const count = await this.repository.count();
      this.logger.debug(`统计实例数量: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('统计实例数量失败', error);
      throw error;
    }
  }

  /**
   * 根据状态统计实例数量
   */
  async countByStatus(isActive: boolean): Promise<number> {
    try {
      const count = await this.repository.count({ where: { isActive } });
      this.logger.debug(`根据状态统计实例数量: ${isActive}, 结果: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(`根据状态统计实例数量失败: ${isActive}`, error);
      throw error;
    }
  }

  /**
   * 批量保存实例
   */
  async saveMany(instances: GitLabInstance[]): Promise<GitLabInstance[]> {
    try {
      const savedInstances = await this.repository.save(instances);
      this.logger.debug(`批量保存实例: ${savedInstances.length} 个`);
      return savedInstances;
    } catch (error) {
      this.logger.error(`批量保存实例失败: ${instances.length} 个`, error);
      throw error;
    }
  }

  /**
   * 批量删除实例
   */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await this.repository.delete(ids);
      this.logger.debug(`批量删除实例: ${ids.length} 个`);
    } catch (error) {
      this.logger.error(`批量删除实例失败: ${ids.length} 个`, error);
      throw error;
    }
  }

  /**
   * 软删除实例（设置isActive为false）
   */
  async softDelete(id: string): Promise<void> {
    try {
      const existingInstance = await this.findById(id);
      if (!existingInstance) {
        throw new GitLabInstanceNotFoundException(id);
      }

      await this.repository.update(id, { isActive: false });
      this.logger.debug(`软删除实例: ${id}`);
    } catch (error) {
      this.logger.error(`软删除实例失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 恢复软删除的实例
   */
  async restore(id: string): Promise<void> {
    try {
      const existingInstance = await this.findById(id);
      if (!existingInstance) {
        throw new GitLabInstanceNotFoundException(id);
      }

      await this.repository.update(id, { isActive: true });
      this.logger.debug(`恢复实例: ${id}`);
    } catch (error) {
      this.logger.error(`恢复实例失败: ${id}`, error);
      throw error;
    }
  }
}
