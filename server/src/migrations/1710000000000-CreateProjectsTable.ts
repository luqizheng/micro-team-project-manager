import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectsTable1710000000000 implements MigrationInterface {
  name = 'CreateProjectsTable1710000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id char(36) NOT NULL,
        ` +
      // backticks need escaping in template
      `key` +
      ` varchar(20) NOT NULL,
        name varchar(80) NOT NULL,
        visibility varchar(16) NOT NULL DEFAULT 'private',
        archived tinyint(1) NOT NULL DEFAULT 0,
        createdBy varchar(255) NOT NULL,
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_projects_key (` +
      `key` +
      `)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS projects');
  }
}


