import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeReporterIdNullable1710000009000 implements MigrationInterface {
    name = 'MakeReporterIdNullable1710000009000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 修改 reporter_id 字段为可空
        await queryRunner.query(`
            ALTER TABLE issues 
            MODIFY COLUMN reporter_id VARCHAR(36) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：将 reporter_id 字段设为不可空
        // 注意：如果存在 NULL 值，这个操作可能会失败
        await queryRunner.query(`
            ALTER TABLE issues 
            MODIFY COLUMN reporter_id VARCHAR(36) NOT NULL
        `);
    }
}
