import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComments1710000003000 implements MigrationInterface {
  name = 'CreateComments1710000003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id char(36) NOT NULL,
        issue_id char(36) NOT NULL,
        author_id char(36) NOT NULL,
        body mediumtext NOT NULL,
        mentions json NULL,
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY ix_comments_issue_created (issue_id, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    await queryRunner.query(`CREATE FULLTEXT INDEX ft_comments_body ON comments (body)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS comments');
  }
}


