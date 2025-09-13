import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex, View } from 'typeorm';

export class CreateGitLabIntegrationTables1757663000000 implements MigrationInterface {
  name = 'CreateGitLabIntegrationTables1757663000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建GitLab实例配置表
    await queryRunner.createTable(
      new Table({
        name: 'gitlab_instances',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: '主键ID',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: '实例名称',
          },
          {
            name: 'base_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'GitLab实例基础URL',
          },
          {
            name: 'api_token',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'API访问令牌（加密存储）',
          },
          {
            name: 'webhook_secret',
            type: 'varchar',
            length: '128',
            isNullable: true,
            comment: 'Webhook签名密钥',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: '是否激活',
          },
          {
            name: 'instance_type',
            type: 'enum',
            enum: ['self_hosted', 'gitlab_com'],
            default: "'self_hosted'",
            comment: '实例类型',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            comment: '更新时间',
          },
        ],
      }),
      true,
    );

    // 2. 创建GitLab项目映射表
    await queryRunner.createTable(
      new Table({
        name: 'gitlab_project_mappings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: '主键ID',
          },
          {
            name: 'project_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: '项目管理工具项目ID',
          },
          {
            name: 'gitlab_instance_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: 'GitLab实例ID',
          },
          {
            name: 'gitlab_project_id',
            type: 'int',
            isNullable: false,
            comment: 'GitLab项目ID',
          },
          {
            name: 'gitlab_project_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'GitLab项目路径',
          },
          {
            name: 'webhook_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'GitLab Webhook ID',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: '是否激活',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            comment: '更新时间',
          },
        ],
      }),
      true,
    );

    // 3. 创建GitLab事件日志表
    await queryRunner.createTable(
      new Table({
        name: 'gitlab_event_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: '主键ID',
          },
          {
            name: 'gitlab_instance_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: 'GitLab实例ID',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: '事件类型',
          },
          {
            name: 'event_data',
            type: 'json',
            isNullable: false,
            comment: '事件数据',
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
            comment: '是否已处理',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: '错误信息',
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
            comment: '重试次数',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
            comment: '处理时间',
          },
        ],
      }),
      true,
    );

    // 4. 创建GitLab用户映射表
    await queryRunner.createTable(
      new Table({
        name: 'gitlab_user_mappings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: '主键ID',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: '项目管理工具用户ID',
          },
          {
            name: 'gitlab_instance_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: 'GitLab实例ID',
          },
          {
            name: 'gitlab_user_id',
            type: 'int',
            isNullable: false,
            comment: 'GitLab用户ID',
          },
          {
            name: 'gitlab_username',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'GitLab用户名',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            comment: '更新时间',
          },
        ],
      }),
      true,
    );

    // 5. 创建GitLab同步状态表
    await queryRunner.createTable(
      new Table({
        name: 'gitlab_sync_status',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: '主键ID',
          },
          {
            name: 'mapping_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
            comment: '项目映射ID',
          },
          {
            name: 'last_sync_at',
            type: 'timestamp',
            isNullable: true,
            comment: '最后同步时间',
          },
          {
            name: 'sync_status',
            type: 'enum',
            enum: ['success', 'failed', 'in_progress'],
            default: "'in_progress'",
            comment: '同步状态',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: '错误信息',
          },
          {
            name: 'sync_count',
            type: 'int',
            default: 0,
            comment: '同步次数',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            comment: '更新时间',
          },
        ],
      }),
      true,
    );

    // 6. 为GitLab实例表添加索引
    await queryRunner.createIndex('gitlab_instances', new TableIndex({
      name: 'idx_gitlab_instances_active',
      columnNames: ['is_active'],
    }));

    await queryRunner.createIndex('gitlab_instances', new TableIndex({
      name: 'idx_gitlab_instances_type',
      columnNames: ['instance_type'],
    }));

    await queryRunner.createIndex('gitlab_instances', new TableIndex({
      name: 'idx_gitlab_instances_created_at',
      columnNames: ['created_at'],
    }));

    // 7. 为GitLab项目映射表添加索引
    await queryRunner.createIndex('gitlab_project_mappings', new TableIndex({
      name: 'idx_gitlab_mappings_project',
      columnNames: ['project_id'],
    }));

    await queryRunner.createIndex('gitlab_project_mappings', new TableIndex({
      name: 'idx_gitlab_mappings_instance',
      columnNames: ['gitlab_instance_id'],
    }));

    await queryRunner.createIndex('gitlab_project_mappings', new TableIndex({
      name: 'idx_gitlab_mappings_gitlab_project',
      columnNames: ['gitlab_project_id'],
    }));

    await queryRunner.createIndex('gitlab_project_mappings', new TableIndex({
      name: 'idx_gitlab_mappings_active',
      columnNames: ['is_active'],
    }));

    // 8. 为GitLab事件日志表添加索引
    await queryRunner.createIndex('gitlab_event_logs', new TableIndex({
      name: 'idx_gitlab_events_instance',
      columnNames: ['gitlab_instance_id'],
    }));

    await queryRunner.createIndex('gitlab_event_logs', new TableIndex({
      name: 'idx_gitlab_events_type',
      columnNames: ['event_type'],
    }));

    await queryRunner.createIndex('gitlab_event_logs', new TableIndex({
      name: 'idx_gitlab_events_processed',
      columnNames: ['processed'],
    }));

    await queryRunner.createIndex('gitlab_event_logs', new TableIndex({
      name: 'idx_gitlab_events_created_at',
      columnNames: ['created_at'],
    }));

    await queryRunner.createIndex('gitlab_event_logs', new TableIndex({
      name: 'idx_gitlab_events_retry',
      columnNames: ['retry_count', 'processed'],
    }));

    // 9. 为GitLab用户映射表添加索引
    await queryRunner.createIndex('gitlab_user_mappings', new TableIndex({
      name: 'idx_gitlab_user_mappings_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('gitlab_user_mappings', new TableIndex({
      name: 'idx_gitlab_user_mappings_instance',
      columnNames: ['gitlab_instance_id'],
    }));

    await queryRunner.createIndex('gitlab_user_mappings', new TableIndex({
      name: 'idx_gitlab_user_mappings_gitlab_user',
      columnNames: ['gitlab_user_id'],
    }));

    // 10. 为GitLab同步状态表添加索引
    await queryRunner.createIndex('gitlab_sync_status', new TableIndex({
      name: 'idx_gitlab_sync_mapping',
      columnNames: ['mapping_id'],
    }));

    await queryRunner.createIndex('gitlab_sync_status', new TableIndex({
      name: 'idx_gitlab_sync_status',
      columnNames: ['sync_status'],
    }));

    await queryRunner.createIndex('gitlab_sync_status', new TableIndex({
      name: 'idx_gitlab_sync_last_sync',
      columnNames: ['last_sync_at'],
    }));

    // 11. 添加外键约束
    await queryRunner.createForeignKey('gitlab_project_mappings', new TableForeignKey({
      columnNames: ['project_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'projects',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('gitlab_project_mappings', new TableForeignKey({
      columnNames: ['gitlab_instance_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'gitlab_instances',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('gitlab_event_logs', new TableForeignKey({
      columnNames: ['gitlab_instance_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'gitlab_instances',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('gitlab_user_mappings', new TableForeignKey({
      columnNames: ['user_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('gitlab_user_mappings', new TableForeignKey({
      columnNames: ['gitlab_instance_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'gitlab_instances',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('gitlab_sync_status', new TableForeignKey({
      columnNames: ['mapping_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'gitlab_project_mappings',
      onDelete: 'CASCADE',
    }));

    // 12. 添加唯一约束
    await queryRunner.createIndex('gitlab_project_mappings', new TableIndex({
      name: 'unique_mapping',
      columnNames: ['project_id', 'gitlab_instance_id', 'gitlab_project_id'],
      isUnique: true,
    }));

    await queryRunner.createIndex('gitlab_user_mappings', new TableIndex({
      name: 'unique_user_mapping',
      columnNames: ['user_id', 'gitlab_instance_id'],
      isUnique: true,
    }));

    await queryRunner.createIndex('gitlab_user_mappings', new TableIndex({
      name: 'unique_gitlab_user',
      columnNames: ['gitlab_instance_id', 'gitlab_user_id'],
      isUnique: true,
    }));

    await queryRunner.createIndex('gitlab_sync_status', new TableIndex({
      name: 'unique_mapping_sync',
      columnNames: ['mapping_id'],
      isUnique: true,
    }));

    // 13. 扩展现有Issue表，添加GitLab相关字段
    await queryRunner.addColumn('issues', new TableColumn({
      name: 'gitlab_issue_id',
      type: 'int',
      isNullable: true,
      comment: 'GitLab Issue ID',
    }));

    await queryRunner.addColumn('issues', new TableColumn({
      name: 'gitlab_merge_request_id',
      type: 'int',
      isNullable: true,
      comment: 'GitLab Merge Request ID',
    }));

    await queryRunner.addColumn('issues', new TableColumn({
      name: 'gitlab_commit_sha',
      type: 'varchar',
      length: '40',
      isNullable: true,
      comment: 'GitLab Commit SHA',
    }));

    await queryRunner.addColumn('issues', new TableColumn({
      name: 'gitlab_pipeline_id',
      type: 'int',
      isNullable: true,
      comment: 'GitLab Pipeline ID',
    }));

    await queryRunner.addColumn('issues', new TableColumn({
      name: 'gitlab_url',
      type: 'varchar',
      length: '500',
      isNullable: true,
      comment: 'GitLab相关URL',
    }));

    // 14. 为Issue表的GitLab字段添加索引
    await queryRunner.createIndex('issues', new TableIndex({
      name: 'idx_issues_gitlab_issue',
      columnNames: ['gitlab_issue_id'],
    }));

    await queryRunner.createIndex('issues', new TableIndex({
      name: 'idx_issues_gitlab_mr',
      columnNames: ['gitlab_merge_request_id'],
    }));

    await queryRunner.createIndex('issues', new TableIndex({
      name: 'idx_issues_gitlab_commit',
      columnNames: ['gitlab_commit_sha'],
    }));

    await queryRunner.createIndex('issues', new TableIndex({
      name: 'idx_issues_gitlab_pipeline',
      columnNames: ['gitlab_pipeline_id'],
    }));

    // 15. 创建GitLab集成概览视图
    const view = new View({
      name: 'gitlab_integration_overview',
      expression: `
        SELECT 
          gi.id as instance_id,
          gi.name as instance_name,
          gi.base_url,
          gi.instance_type,
          gi.is_active as instance_active,
          COUNT(gpm.id) as project_count,
          COUNT(CASE WHEN gpm.is_active = TRUE THEN 1 END) as active_project_count,
          MAX(gss.last_sync_at) as last_sync_time,
          COUNT(CASE WHEN gss.sync_status = 'failed' THEN 1 END) as failed_sync_count
        FROM gitlab_instances gi
        LEFT JOIN gitlab_project_mappings gpm ON gi.id = gpm.gitlab_instance_id
        LEFT JOIN gitlab_sync_status gss ON gpm.id = gss.mapping_id
        GROUP BY gi.id, gi.name, gi.base_url, gi.instance_type, gi.is_active
        `,
    });
    await queryRunner.createView(view);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除视图
    await queryRunner.dropView('gitlab_integration_overview');

    // 删除Issue表的GitLab字段索引
    await queryRunner.dropIndex('issues', 'idx_issues_gitlab_pipeline');
    await queryRunner.dropIndex('issues', 'idx_issues_gitlab_commit');
    await queryRunner.dropIndex('issues', 'idx_issues_gitlab_mr');
    await queryRunner.dropIndex('issues', 'idx_issues_gitlab_issue');

    // 删除Issue表的GitLab字段
    await queryRunner.dropColumn('issues', 'gitlab_url');
    await queryRunner.dropColumn('issues', 'gitlab_pipeline_id');
    await queryRunner.dropColumn('issues', 'gitlab_commit_sha');
    await queryRunner.dropColumn('issues', 'gitlab_merge_request_id');
    await queryRunner.dropColumn('issues', 'gitlab_issue_id');

    // 删除表（会级联删除外键和索引）
    await queryRunner.dropTable('gitlab_sync_status');
    await queryRunner.dropTable('gitlab_user_mappings');
    await queryRunner.dropTable('gitlab_event_logs');
    await queryRunner.dropTable('gitlab_project_mappings');
    await queryRunner.dropTable('gitlab_instances');
  }
}
