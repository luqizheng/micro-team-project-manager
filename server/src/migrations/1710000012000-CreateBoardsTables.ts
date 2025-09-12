import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBoardsTables1710000012000 implements MigrationInterface {
  name = 'CreateBoardsTables1710000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 boards 表
    await queryRunner.query(`CREATE TABLE \`boards\` (\`id\` varchar(36) NOT NULL, \`project_id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`is_default\` boolean NOT NULL DEFAULT false, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

    // 创建 board_columns 表
    await queryRunner.query(`CREATE TABLE \`board_columns\` (\`id\` varchar(36) NOT NULL, \`board_id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`wip_limit\` int NULL, \`sort_order\` int NOT NULL DEFAULT 0, \`state_mapping\` varchar(128) NOT NULL, \`color\` varchar(16) NOT NULL DEFAULT '#1890ff', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);

    // 创建索引
    await queryRunner.query(`CREATE INDEX IDX_boards_project_id ON boards (project_id)`);
    await queryRunner.query(`CREATE INDEX IDX_board_columns_board_id ON board_columns (board_id)`);
    await queryRunner.query(`CREATE INDEX IDX_board_columns_sort_order ON board_columns (board_id, sort_order)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE board_columns`);
    await queryRunner.query(`DROP TABLE boards`);
  }
}
