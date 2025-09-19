import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddParentIdToFeatureModules1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 parent_id 列（可空�?
    await queryRunner.addColumn(
      'feature_modules',
      new TableColumn({
        name: 'parent_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    // 添加组合索引 (project_id, parent_id)
    await queryRunner.createIndex(
      'feature_modules',
      new TableIndex({
        name: 'IDX_feature_modules_project_parent',
        columnNames: ['project_id', 'parent_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('feature_modules', 'IDX_feature_modules_project_parent');
    await queryRunner.dropColumn('feature_modules', 'parent_id');
  }
}


