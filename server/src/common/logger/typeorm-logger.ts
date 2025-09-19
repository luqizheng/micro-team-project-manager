import { Logger } from '@nestjs/common';
import { Logger as TypeOrmLogger } from 'typeorm';

export class CustomTypeOrmLogger implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');

  logQuery(query: string, parameters?: any[]) {
    this.logger.log(`\n🔍 Query: ${query}`);
    if (parameters && parameters.length > 0) {
      this.logger.log(`📊 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    this.logger.error(`\n�?Query Error: ${error}`);
    this.logger.error(`🔍 Query: ${query}`);
    if (parameters && parameters.length > 0) {
      this.logger.error(`📊 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn(`\n�?Slow Query (${time}ms): ${query}`);
    if (parameters && parameters.length > 0) {
      this.logger.warn(`📊 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logSchemaBuild(message: string) {
    this.logger.log(`\n🏗�?Schema: ${message}`);
  }

  logMigration(message: string) {
    this.logger.log(`\n🔄 Migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    switch (level) {
      case 'log':
        this.logger.log(`\n📝 Log: ${message}`);
        break;
      case 'info':
        this.logger.log(`\nℹ️ Info: ${message}`);
        break;
      case 'warn':
        this.logger.warn(`\n⚠️ Warning: ${message}`);
        break;
    }
  }
}
