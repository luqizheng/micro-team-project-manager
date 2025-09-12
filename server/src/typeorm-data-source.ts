import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ProjectEntity } from './modules/projects/project.entity';

export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [ProjectEntity],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // 记录执行时间超过1秒的查询
});


