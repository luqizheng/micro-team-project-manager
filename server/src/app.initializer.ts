import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './modules/users/users.service';
import { createHash } from 'crypto';

@Injectable()
export class AppInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppInitializer.name);

  constructor(private readonly users: UsersService, private readonly config: ConfigService) {}

  private hash(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  async onApplicationBootstrap(): Promise<void> {
    const adminsRaw = this.config.get<string>('ADMIN_EMAILS') ?? '';
    const emails = adminsRaw
      .split(/[\s,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (emails.length === 0) {
      this.logger.log('No ADMIN_EMAILS configured; skip admin seeding.');
      return;
    }

    const defaultPassword = this.config.get<string>('ADMIN_DEFAULT_PASSWORD') ?? 'admin123456';
    const passwordHash = this.hash(defaultPassword);

    for (const email of emails) {
      const existing = await this.users.findByEmail(email);
      if (existing) {
        this.logger.log(`Admin user exists: ${email}`);
        continue;
      }

      const name = email.includes('@') ? email.split('@')[0] : email;
      await this.users.createBasic({ 
        email, 
        name, 
        passwordHash, 
        status: 'active',
        systemRoles: ['admin']
      });
      this.logger.warn(`Admin user created: ${email} (default password set, admin role assigned)`);
    }
  }
}


