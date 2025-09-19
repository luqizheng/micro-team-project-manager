import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateProjectMappingsToGroupMappings1735000000001 implements MigrationInterface {
  name = 'MigrateProjectMappingsToGroupMappings1735000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 首先检查是否存在gitlab_project_mappings�?
    const projectMappingsTableExists = await queryRunner.hasTable('gitlab_project_mappings');
    
    if (projectMappingsTableExists) {
      // 2. 将现有的project mappings数据迁移到group mappings
      // 注意：这里假设gitlabProjectId实际上对应的是GitLab的Group ID
      // 如果实际情况不同，需要根据具体业务逻辑调整
      await queryRunner.query(`
        INSERT INTO gitlab_group_mappings (
          id, 
          projectId, 
          gitlabInstanceId, 
          gitlabGroupId, 
          gitlabGroupPath, 
          isActive, 
          createdAt, 
          updatedAt
        )
        SELECT 
          id,
          projectId,
          gitlabInstanceId,
          gitlabProjectId as gitlabGroupId,
          gitlabProjectPath as gitlabGroupPath,
          isActive,
          createdAt,
          updatedAt
        FROM gitlab_project_mappings
      `);

      // 3. 更新gitlab_sync_status表，将mappingId关联到新的group mappings
      // 由于我们使用了相同的ID，这个步骤可能不需要，但为了安全起见我们检查一�?
      await queryRunner.query(`
        UPDATE gitlab_sync_status 
        SET mappingId = mappingId 
        WHERE mappingId IN (SELECT id FROM gitlab_project_mappings)
      `);

      // 4. 删除gitlab_project_mappings表的外键约束
      await queryRunner.query(`ALTER TABLE gitlab_sync_status DROP FOREIGN KEY FK_23a3e650acce1182e043a2f2aff`);
      await queryRunner.query(`ALTER TABLE gitlab_project_mappings DROP FOREIGN KEY FK_fbd7d315aded189ab18674e450f`);
      await queryRunner.query(`ALTER TABLE gitlab_project_mappings DROP FOREIGN KEY FK_c4f90effb9651b6accda8499942`);

      // 5. 删除gitlab_project_mappings表的索引
      await queryRunner.query(`DROP INDEX idx_gitlab_mappings_project ON gitlab_project_mappings`);
      await queryRunner.query(`DROP INDEX idx_gitlab_mappings_instance ON gitlab_project_mappings`);
      await queryRunner.query(`DROP INDEX idx_gitlab_mappings_gitlab_project ON gitlab_project_mappings`);
      await queryRunner.query(`DROP INDEX idx_gitlab_mappings_active ON gitlab_project_mappings`);
      await queryRunner.query(`DROP INDEX unique_mapping ON gitlab_project_mappings`);

      // 6. 删除gitlab_project_mappings�?
      await queryRunner.query(`DROP TABLE gitlab_project_mappings`);

      // 7. 更新gitlab_sync_status表，添加新的外键约束到gitlab_group_mappings
      await queryRunner.query(`
        ALTER TABLE gitlab_sync_status 
        ADD CONSTRAINT FK_gitlab_sync_status_group_mapping 
        FOREIGN KEY (mappingId) REFERENCES gitlab_group_mappings(id) 
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：重新创建gitlab_project_mappings表并迁移数据回去
    
    // 1. 重新创建gitlab_project_mappings�?
    await queryRunner.query(`
      CREATE TABLE gitlab_project_mappings (
        id varchar(36) NOT NULL,
        projectId varchar(36) NOT NULL COMMENT '项目管理工具项目ID',
        gitlabInstanceId varchar(36) NOT NULL COMMENT 'GitLab实例ID',
        gitlabProjectId int NOT NULL COMMENT 'GitLab项目ID',
        gitlabProjectPath varchar(500) NOT NULL COMMENT 'GitLab项目路径',
        webhookId varchar(36) NULL COMMENT 'GitLab Webhook ID',
        isActive tinyint NOT NULL COMMENT '是否激�? DEFAULT 1,
        createdAt datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB
    `);

    // 2. 创建索引
    await queryRunner.query(`CREATE INDEX idx_gitlab_mappings_project ON gitlab_project_mappings (projectId)`);
    await queryRunner.query(`CREATE INDEX idx_gitlab_mappings_instance ON gitlab_project_mappings (gitlabInstanceId)`);
    await queryRunner.query(`CREATE INDEX idx_gitlab_mappings_gitlab_project ON gitlab_project_mappings (gitlabProjectId)`);
    await queryRunner.query(`CREATE INDEX idx_gitlab_mappings_active ON gitlab_project_mappings (isActive)`);
    await queryRunner.query(`CREATE UNIQUE INDEX unique_mapping ON gitlab_project_mappings (projectId, gitlabInstanceId, gitlabProjectId)`);

    // 3. 从group mappings迁移数据回去
    await queryRunner.query(`
      INSERT INTO gitlab_project_mappings (
        id,
        projectId,
        gitlabInstanceId,
        gitlabProjectId,
        gitlabProjectPath,
        isActive,
        createdAt,
        updatedAt
      )
      SELECT 
        id,
        projectId,
        gitlabInstanceId,
        gitlabGroupId as gitlabProjectId,
        gitlabGroupPath as gitlabProjectPath,
        isActive,
        createdAt,
        updatedAt
      FROM gitlab_group_mappings
    `);

    // 4. 重新创建外键约束
    await queryRunner.query(`
      ALTER TABLE gitlab_project_mappings 
      ADD CONSTRAINT FK_fbd7d315aded189ab18674e450f 
      FOREIGN KEY (projectId) REFERENCES projects(id) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE gitlab_project_mappings 
      ADD CONSTRAINT FK_c4f90effb9651b6accda8499942 
      FOREIGN KEY (gitlabInstanceId) REFERENCES gitlab_instances(id) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 5. 更新gitlab_sync_status的外键约�?
    await queryRunner.query(`ALTER TABLE gitlab_sync_status DROP FOREIGN KEY FK_gitlab_sync_status_group_mapping`);
    await queryRunner.query(`
      ALTER TABLE gitlab_sync_status 
      ADD CONSTRAINT FK_23a3e650acce1182e043a2f2aff 
      FOREIGN KEY (mappingId) REFERENCES gitlab_project_mappings(id) 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
