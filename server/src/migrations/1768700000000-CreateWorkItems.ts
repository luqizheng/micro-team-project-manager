import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkItems1768700000000 implements MigrationInterface {
  name = 'CreateWorkItems1768700000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 work_items �?
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS work_items (
        id char(36) NOT NULL,
        type varchar(16) NOT NULL,
        project_id char(36) NOT NULL,
        requirement_id char(36) NULL,
        subsystem_id char(36) NULL,
        feature_module_id char(36) NULL,
        title varchar(140) NOT NULL,
        description mediumtext NULL,
        state varchar(32) NOT NULL,
        priority varchar(16) NULL,
        severity varchar(16) NULL,
        assignee_id char(36) NULL,
        reporter_id char(36) NULL,
        story_points int NULL,
        estimate_minutes int NULL,
        remaining_minutes int NULL,
        estimated_hours decimal(5,1) NULL,
        actual_hours decimal(5,1) NULL,
        sprint_id char(36) NULL,
        release_id char(36) NULL,
        parent_id char(36) NULL,
        labels json NULL,
        due_at timestamp(6) NULL,
        created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted tinyint(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        INDEX IDX_wi_proj_type_state_asg_upd (project_id, type, state, assignee_id, updated_at),
        INDEX IDX_wi_proj_title (project_id, title),
        INDEX IDX_wi_req (requirement_id),
        INDEX IDX_wi_sub (subsystem_id),
        INDEX IDX_wi_fm (feature_module_id),
        INDEX IDX_wi_parent (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS work_items');
  }
}


