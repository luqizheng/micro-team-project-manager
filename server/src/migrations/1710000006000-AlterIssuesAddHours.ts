import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterIssuesAddHours1710000006000 implements MigrationInterface {
  name = 'AlterIssuesAddHours1710000006000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE issues
      ADD COLUMN estimated_hours decimal(5,1) NULL AFTER remaining_minutes,
      ADD COLUMN actual_hours decimal(5,1) NULL AFTER estimated_hours;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE issues
      DROP COLUMN actual_hours,
      DROP COLUMN estimated_hours;
    `);
  }
}


