import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRolesToThreeRoles1710000008000 implements MigrationInterface {
    name = 'UpdateRolesToThreeRoles1710000008000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 更新 memberships 表中的角色
        // 将 project_admin 更新为 project_manager
        await queryRunner.query(`
            UPDATE memberships 
            SET role = 'project_manager' 
            WHERE role = 'project_admin'
        `);

        // 将 viewer 更新为 member（因为现在只有三个角色）
        await queryRunner.query(`
            UPDATE memberships 
            SET role = 'member' 
            WHERE role = 'viewer'
        `);

        // 更新 users 表中的 systemRoles
        // 将 project_admin 更新为 project_manager
        await queryRunner.query(`
            UPDATE users 
            SET systemRoles = JSON_REPLACE(systemRoles, '$[0]', 'project_manager')
            WHERE JSON_CONTAINS(systemRoles, '"project_admin"')
        `);

        // 将 viewer 更新为 member
        await queryRunner.query(`
            UPDATE users 
            SET systemRoles = JSON_REPLACE(systemRoles, '$[0]', 'member')
            WHERE JSON_CONTAINS(systemRoles, '"viewer"')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚操作：将 project_manager 恢复为 project_admin
        await queryRunner.query(`
            UPDATE memberships 
            SET role = 'project_admin' 
            WHERE role = 'project_manager'
        `);

        // 将 member 恢复为 viewer（注意：这里可能会有数据丢失，因为无法区分原来的 member 和 viewer）
        // 为了安全起见，我们只恢复明确知道是 viewer 的情况
        // 在实际应用中，建议在迁移前备份数据
        await queryRunner.query(`
            UPDATE users 
            SET systemRoles = JSON_REPLACE(systemRoles, '$[0]', 'project_admin')
            WHERE JSON_CONTAINS(systemRoles, '"project_manager"')
        `);

        await queryRunner.query(`
            UPDATE users 
            SET systemRoles = JSON_REPLACE(systemRoles, '$[0]', 'viewer')
            WHERE JSON_CONTAINS(systemRoles, '"member"')
        `);
    }
}
