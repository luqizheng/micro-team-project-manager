import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ProjectEntity } from './modules/projects/project.entity';

export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [ProjectEntity],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: false,
});


