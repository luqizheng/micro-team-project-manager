import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipEntity } from './membership.entity';

@Injectable()
export class MembershipsService {
  constructor(@InjectRepository(MembershipEntity) private readonly repo: Repository<MembershipEntity>) {}

  findRole(projectId: string, userId: string) {
    return this.repo.findOne({ where: { projectId, userId } });
  }

  async createMembership(projectId: string, userId: string, role: string) {
    // 检查是否已存在
    const existing = await this.findRole(projectId, userId);
    if (existing) {
      return existing;
    }

    const membership = this.repo.create({
      projectId,
      userId,
      role,
    });

    return this.repo.save(membership);
  }

  async getUserMemberships(userId: string) {
    return this.repo.find({ where: { userId } });
  }

  async removeMembership(projectId: string, userId: string) {
    return this.repo.delete({ projectId, userId });
  }
}


