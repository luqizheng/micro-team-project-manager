import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReleases1710000005000 implements MigrationInterface {
  name = 'CreateReleases1710000005000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS releases (
        id char(36) NOT NULL,
        project_id char(36) NOT NULL,
        name varchar(255) NOT NULL,
        tag varchar(255) NOT NULL,
        notes mediumtext NULL,
        released_at timestamp(6) NULL,
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY ix_releases_project_released (project_id, released_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS releases');
  }
}


