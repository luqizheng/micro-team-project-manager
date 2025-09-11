import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersMemberships1710000002000 implements MigrationInterface {
  name = 'CreateUsersMemberships1710000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id char(36) NOT NULL,
        email varchar(160) NOT NULL,
        name varchar(120) NOT NULL,
        avatar varchar(255) NULL,
        passwordHash varchar(255) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'active',
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        id char(36) NOT NULL,
        project_id char(36) NOT NULL,
        user_id char(36) NOT NULL,
        role varchar(32) NOT NULL,
        joinedAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_membership (project_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS memberships');
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}


