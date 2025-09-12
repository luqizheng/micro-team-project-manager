import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemRolesToUsers1710000007000 implements MigrationInterface {
    name = 'AddSystemRolesToUsers1710000007000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`systemRoles\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`systemRoles\``);
    }
}
