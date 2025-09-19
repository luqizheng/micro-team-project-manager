import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateGitLabGroupMappings1735000000000 implements MigrationInterface {
  name = 'CreateGitLabGroupMappings1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建gitlab_group_mappings�?
    await queryRunner.createTable(
      new Table({
        name: 'gitlab_group_mappings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid()',
            comment: '主键ID',
          },
          {
            name: 'projectId',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: '项目管理工具项目ID',
          },
          {
            name: 'gitlabInstanceId',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: 'GitLab实例ID',
          },
          {
            name: 'gitlabGroupId',
            type: 'int',
            isNullable: false,
            comment: 'GitLab分组ID',
          },
          {
            name: 'gitlabGroupPath',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'GitLab分组路径',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: '是否激活',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            isNullable: false,
            comment: '创建时间',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)',
            isNullable: false,
            comment: '更新时间',
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'gitlab_group_mappings',
      new TableIndex({
        name: 'idx_gitlab_group_mappings_project',
        columnNames: ['projectId']
      })
    );

    await queryRunner.createIndex(
      'gitlab_group_mappings',
      new TableIndex({
        name: 'idx_gitlab_group_mappings_instance',
        columnNames: ['gitlabInstanceId']
      })
    );

    await queryRunner.createIndex(
      'gitlab_group_mappings',
      new TableIndex({
        name: 'idx_gitlab_group_mappings_gitlab_group',
        columnNames: ['gitlabGroupId']
      })
    );

    await queryRunner.createIndex(
      'gitlab_group_mappings',
      new TableIndex({
        name: 'idx_gitlab_group_mappings_active',
        columnNames: ['isActive']
      })
    );

    // 创建唯一索引
    await queryRunner.createIndex(
      'gitlab_group_mappings',
      new TableIndex({
        name: 'unique_group_mapping',
        columnNames: ['projectId', 'gitlabInstanceId', 'gitlabGroupId'],
        isUnique: true
      })
    );

    // 创建外键约束
    await queryRunner.createForeignKey(
      'gitlab_group_mappings',
      new TableForeignKey({
        columnNames: ['projectId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
        name: 'FK_gitlab_group_mappings_project',
      })
    );

    await queryRunner.createForeignKey(
      'gitlab_group_mappings',
      new TableForeignKey({
        columnNames: ['gitlabInstanceId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'gitlab_instances',
        onDelete: 'CASCADE',
        name: 'FK_gitlab_group_mappings_instance',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键约束
    await queryRunner.dropForeignKey('gitlab_group_mappings', 'FK_gitlab_group_mappings_instance');
    await queryRunner.dropForeignKey('gitlab_group_mappings', 'FK_gitlab_group_mappings_project');

    // 删除索引
    await queryRunner.dropIndex('gitlab_group_mappings', 'unique_group_mapping');
    await queryRunner.dropIndex('gitlab_group_mappings', 'idx_gitlab_group_mappings_active');
    await queryRunner.dropIndex('gitlab_group_mappings', 'idx_gitlab_group_mappings_gitlab_group');
    await queryRunner.dropIndex('gitlab_group_mappings', 'idx_gitlab_group_mappings_instance');
    await queryRunner.dropIndex('gitlab_group_mappings', 'idx_gitlab_group_mappings_project');

    // 删除表
    await queryRunner.dropTable('gitlab_group_mappings');
  }
}
