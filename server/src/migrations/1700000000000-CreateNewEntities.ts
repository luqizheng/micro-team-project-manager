import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewEntities1700000000000 implements MigrationInterface {
    name = 'CreateNewEntities1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 创建需求表
        await queryRunner.query(`
            CREATE TABLE \`requirements\` (
                \`id\` varchar(36) NOT NULL,
                \`project_id\` varchar(36) NOT NULL,
                \`title\` varchar(140) NOT NULL,
                \`description\` mediumtext NULL,
                \`state\` varchar(32) NOT NULL,
                \`priority\` varchar(16) NULL,
                \`assignee_id\` varchar(36) NULL,
                \`reporter_id\` varchar(36) NULL,
                \`story_points\` int NULL,
                \`labels\` json NULL,
                \`due_at\` timestamp(6) NULL,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted\` tinyint NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 创建需求表索引
        await queryRunner.query(`
            CREATE INDEX \`IDX_requirements_project_state_assignee_updated\` ON \`requirements\` (\`project_id\`, \`state\`, \`assignee_id\`, \`updatedAt\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_requirements_project_title\` ON \`requirements\` (\`project_id\`, \`title\`)
        `);

        // 创建子系统表
        await queryRunner.query(`
            CREATE TABLE \`subsystems\` (
                \`id\` varchar(36) NOT NULL,
                \`project_id\` varchar(36) NOT NULL,
                \`requirement_id\` varchar(36) NULL,
                \`title\` varchar(140) NOT NULL,
                \`description\` mediumtext NULL,
                \`state\` varchar(32) NOT NULL,
                \`assignee_id\` varchar(36) NULL,
                \`labels\` json NULL,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted\` tinyint NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 创建子系统表索引
        await queryRunner.query(`
            CREATE INDEX \`IDX_subsystems_project_state_assignee_updated\` ON \`subsystems\` (\`project_id\`, \`state\`, \`assignee_id\`, \`updatedAt\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_subsystems_project_title\` ON \`subsystems\` (\`project_id\`, \`title\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_subsystems_requirement\` ON \`subsystems\` (\`requirement_id\`)
        `);

        // 创建功能模块表
        await queryRunner.query(`
            CREATE TABLE \`feature_modules\` (
                \`id\` varchar(36) NOT NULL,
                \`project_id\` varchar(36) NOT NULL,
                \`requirement_id\` varchar(36) NULL,
                \`subsystem_id\` varchar(36) NULL,
                \`title\` varchar(140) NOT NULL,
                \`description\` mediumtext NULL,
                \`state\` varchar(32) NOT NULL,
                \`assignee_id\` varchar(36) NULL,
                \`labels\` json NULL,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted\` tinyint NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 创建功能模块表索引
        await queryRunner.query(`
            CREATE INDEX \`IDX_feature_modules_project_state_assignee_updated\` ON \`feature_modules\` (\`project_id\`, \`state\`, \`assignee_id\`, \`updatedAt\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_feature_modules_project_title\` ON \`feature_modules\` (\`project_id\`, \`title\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_feature_modules_requirement\` ON \`feature_modules\` (\`requirement_id\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_feature_modules_subsystem\` ON \`feature_modules\` (\`subsystem_id\`)
        `);

        // 创建任务表
        await queryRunner.query(`
            CREATE TABLE \`tasks\` (
                \`id\` varchar(36) NOT NULL,
                \`project_id\` varchar(36) NOT NULL,
                \`requirement_id\` varchar(36) NULL,
                \`subsystem_id\` varchar(36) NULL,
                \`feature_module_id\` varchar(36) NULL,
                \`title\` varchar(140) NOT NULL,
                \`description\` mediumtext NULL,
                \`state\` varchar(32) NOT NULL,
                \`priority\` varchar(16) NULL,
                \`assignee_id\` varchar(36) NULL,
                \`reporter_id\` varchar(36) NULL,
                \`story_points\` int NULL,
                \`estimate_minutes\` int NULL,
                \`remaining_minutes\` int NULL,
                \`estimated_hours\` decimal(5,1) NULL,
                \`actual_hours\` decimal(5,1) NULL,
                \`sprint_id\` varchar(36) NULL,
                \`release_id\` varchar(36) NULL,
                \`parent_id\` varchar(36) NULL,
                \`labels\` json NULL,
                \`due_at\` timestamp(6) NULL,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted\` tinyint NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 创建任务表索引
        await queryRunner.query(`
            CREATE INDEX \`IDX_tasks_project_state_assignee_updated\` ON \`tasks\` (\`project_id\`, \`state\`, \`assignee_id\`, \`updatedAt\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_tasks_project_title\` ON \`tasks\` (\`project_id\`, \`title\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_tasks_requirement\` ON \`tasks\` (\`requirement_id\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_tasks_subsystem\` ON \`tasks\` (\`subsystem_id\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_tasks_feature_module\` ON \`tasks\` (\`feature_module_id\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_tasks_parent\` ON \`tasks\` (\`parent_id\`)
        `);

        // 创建缺陷表
        await queryRunner.query(`
            CREATE TABLE \`bugs\` (
                \`id\` varchar(36) NOT NULL,
                \`project_id\` varchar(36) NOT NULL,
                \`subsystem_id\` varchar(36) NULL,
                \`feature_module_id\` varchar(36) NULL,
                \`title\` varchar(140) NOT NULL,
                \`description\` mediumtext NULL,
                \`state\` varchar(32) NOT NULL,
                \`priority\` varchar(16) NULL,
                \`severity\` varchar(16) NULL,
                \`assignee_id\` varchar(36) NULL,
                \`reporter_id\` varchar(36) NULL,
                \`labels\` json NULL,
                \`due_at\` timestamp(6) NULL,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted\` tinyint NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 创建缺陷表索引
        await queryRunner.query(`
            CREATE INDEX \`IDX_bugs_project_state_assignee_updated\` ON \`bugs\` (\`project_id\`, \`state\`, \`assignee_id\`, \`updatedAt\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_bugs_project_title\` ON \`bugs\` (\`project_id\`, \`title\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_bugs_subsystem\` ON \`bugs\` (\`subsystem_id\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_bugs_feature_module\` ON \`bugs\` (\`feature_module_id\`)
        `);

        // 创建GitLab Epic映射表
        await queryRunner.query(`
            CREATE TABLE \`gitlab_epic_mappings\` (
                \`id\` varchar(36) NOT NULL,
                \`project_id\` varchar(36) NOT NULL,
                \`gitlab_instance_id\` varchar(36) NOT NULL,
                \`gitlab_group_id\` int NOT NULL,
                \`gitlab_epic_id\` int NOT NULL,
                \`entity_type\` enum('requirement', 'subsystem', 'feature_module') NOT NULL,
                \`entity_id\` varchar(36) NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`last_sync_at\` timestamp NULL,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // 创建GitLab Epic映射表索引
        await queryRunner.query(`
            CREATE INDEX \`IDX_gitlab_epic_mappings_project_entity\` ON \`gitlab_epic_mappings\` (\`project_id\`, \`entity_type\`, \`entity_id\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_gitlab_epic_mappings_gitlab\` ON \`gitlab_epic_mappings\` (\`gitlab_instance_id\`, \`gitlab_group_id\`, \`gitlab_epic_id\`)
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX \`IDX_gitlab_epic_mappings_unique\` ON \`gitlab_epic_mappings\` (\`project_id\`, \`entity_type\`, \`entity_id\`)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除GitLab Epic映射表
        await queryRunner.query(`DROP INDEX \`IDX_gitlab_epic_mappings_unique\` ON \`gitlab_epic_mappings\``);
        await queryRunner.query(`DROP INDEX \`IDX_gitlab_epic_mappings_gitlab\` ON \`gitlab_epic_mappings\``);
        await queryRunner.query(`DROP INDEX \`IDX_gitlab_epic_mappings_project_entity\` ON \`gitlab_epic_mappings\``);
        await queryRunner.query(`DROP TABLE \`gitlab_epic_mappings\``);

        // 删除缺陷表
        await queryRunner.query(`DROP INDEX \`IDX_bugs_feature_module\` ON \`bugs\``);
        await queryRunner.query(`DROP INDEX \`IDX_bugs_subsystem\` ON \`bugs\``);
        await queryRunner.query(`DROP INDEX \`IDX_bugs_project_title\` ON \`bugs\``);
        await queryRunner.query(`DROP INDEX \`IDX_bugs_project_state_assignee_updated\` ON \`bugs\``);
        await queryRunner.query(`DROP TABLE \`bugs\``);

        // 删除任务表
        await queryRunner.query(`DROP INDEX \`IDX_tasks_parent\` ON \`tasks\``);
        await queryRunner.query(`DROP INDEX \`IDX_tasks_feature_module\` ON \`tasks\``);
        await queryRunner.query(`DROP INDEX \`IDX_tasks_subsystem\` ON \`tasks\``);
        await queryRunner.query(`DROP INDEX \`IDX_tasks_requirement\` ON \`tasks\``);
        await queryRunner.query(`DROP INDEX \`IDX_tasks_project_title\` ON \`tasks\``);
        await queryRunner.query(`DROP INDEX \`IDX_tasks_project_state_assignee_updated\` ON \`tasks\``);
        await queryRunner.query(`DROP TABLE \`tasks\``);

        // 删除功能模块表
        await queryRunner.query(`DROP INDEX \`IDX_feature_modules_subsystem\` ON \`feature_modules\``);
        await queryRunner.query(`DROP INDEX \`IDX_feature_modules_requirement\` ON \`feature_modules\``);
        await queryRunner.query(`DROP INDEX \`IDX_feature_modules_project_title\` ON \`feature_modules\``);
        await queryRunner.query(`DROP INDEX \`IDX_feature_modules_project_state_assignee_updated\` ON \`feature_modules\``);
        await queryRunner.query(`DROP TABLE \`feature_modules\``);

        // 删除子系统表
        await queryRunner.query(`DROP INDEX \`IDX_subsystems_requirement\` ON \`subsystems\``);
        await queryRunner.query(`DROP INDEX \`IDX_subsystems_project_title\` ON \`subsystems\``);
        await queryRunner.query(`DROP INDEX \`IDX_subsystems_project_state_assignee_updated\` ON \`subsystems\``);
        await queryRunner.query(`DROP TABLE \`subsystems\``);

        // 删除需求表
        await queryRunner.query(`DROP INDEX \`IDX_requirements_project_title\` ON \`requirements\``);
        await queryRunner.query(`DROP INDEX \`IDX_requirements_project_state_assignee_updated\` ON \`requirements\``);
        await queryRunner.query(`DROP TABLE \`requirements\``);
    }
}
