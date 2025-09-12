import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIssueKeyField1757662000000 implements MigrationInterface {
  name = 'AddIssueKeyField1757662000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加key字段
    await queryRunner.query(`
      ALTER TABLE \`issues\` 
      ADD COLUMN \`key\` varchar(50) NULL
    `);

    // 添加唯一索引
    await queryRunner.query(`
      ALTER TABLE \`issues\` 
      ADD UNIQUE INDEX \`IDX_issue_project_key\` (\`project_id\`, \`key\`)
    `);

    // 为现有issues生成key
    await this.generateKeysForExistingIssues(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`
      DROP INDEX \`IDX_issue_project_key\` ON \`issues\`
    `);

    // 删除key字段
    await queryRunner.query(`
      ALTER TABLE \`issues\` 
      DROP COLUMN \`key\`
    `);
  }

  private async generateKeysForExistingIssues(queryRunner: QueryRunner): Promise<void> {
    // 获取所有项目及其key
    const projects = await queryRunner.query(`
      SELECT id, \`key\` as projectKey FROM projects
    `);

    for (const project of projects) {
      // 获取该项目下的所有issues
      const issues = await queryRunner.query(`
        SELECT id FROM issues 
        WHERE project_id = ? 
        ORDER BY created_at ASC
      `, [project.id]);

      // 为每个issue生成key
      for (let i = 0; i < issues.length; i++) {
        const issueKey = `${project.projectKey}_${i + 1}`;
        await queryRunner.query(`
          UPDATE issues 
          SET \`key\` = ? 
          WHERE id = ?
        `, [issueKey, issues[i].id]);
      }
    }
  }
}
