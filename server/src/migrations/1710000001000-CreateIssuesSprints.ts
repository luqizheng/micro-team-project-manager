import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssuesSprints1710000001000 implements MigrationInterface {
  name = 'CreateIssuesSprints1710000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id char(36) NOT NULL,
        project_id char(36) NOT NULL,
        name varchar(255) NOT NULL,
        start_at timestamp(6) NULL,
        end_at timestamp(6) NULL,
        goal varchar(255) NULL,
        capacity int NULL,
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY ix_sprints_project_time (project_id, start_at, end_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id char(36) NOT NULL,
        project_id char(36) NOT NULL,
        type enum('requirement','task','bug') NOT NULL,
        title varchar(140) NOT NULL,
        description mediumtext NULL,
        state varchar(32) NOT NULL,
        priority varchar(16) NULL,
        severity varchar(16) NULL,
        assignee_id char(36) NULL,
        reporter_id char(36) NOT NULL,
        story_points int NULL,
        estimate_minutes int NULL,
        remaining_minutes int NULL,
        sprint_id char(36) NULL,
        release_id char(36) NULL,
        parent_id char(36) NULL,
        labels json NULL,
        due_at timestamp(6) NULL,
        createdAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted tinyint(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        KEY ix_issues_main (project_id, state, assignee_id, updatedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    await queryRunner.query(`
      CREATE FULLTEXT INDEX ft_issues_title_desc ON issues (title, description);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS issues');
    await queryRunner.query('DROP TABLE IF EXISTS sprints');
  }
}


