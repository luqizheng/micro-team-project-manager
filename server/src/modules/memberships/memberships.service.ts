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
}


