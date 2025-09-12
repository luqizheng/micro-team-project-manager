import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisplayNameToUsers1710000011000 implements MigrationInterface {
  name = 'AddDisplayNameToUsers1710000011000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN display_name VARCHAR(120) NULL AFTER name
    `);

    // 为现有用户设置 display_name，使用 name 的值
    await queryRunner.query(`
      UPDATE users 
      SET display_name = name 
      WHERE display_name IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN display_name
    `);
  }
}
