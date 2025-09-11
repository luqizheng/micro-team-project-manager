import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttachments1710000004000 implements MigrationInterface {
  name = 'CreateAttachments1710000004000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id char(36) NOT NULL,
        issue_id char(36) NOT NULL,
        object_key varchar(255) NOT NULL,
        file_name varchar(255) NOT NULL,
        size int NOT NULL,
        content_type varchar(128) NOT NULL,
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY ix_attachments_issue_created (issue_id, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS attachments');
  }
}


