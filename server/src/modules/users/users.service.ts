import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  create(data: Partial<UserEntity>) {
    return this.repo.save(this.repo.create(data));
  }
}


