import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectIssueStates1710000010000 implements MigrationInterface {
  name = 'CreateProjectIssueStates1710000010000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_issue_states (
        id char(36) NOT NULL,
        project_id char(36) NOT NULL,
        issue_type enum('requirement','task','bug') NOT NULL,
        state_key varchar(32) NOT NULL,
        state_name varchar(64) NOT NULL,
        color varchar(16) NOT NULL DEFAULT '#1890ff',
        is_initial tinyint(1) NOT NULL DEFAULT 0,
        is_final tinyint(1) NOT NULL DEFAULT 0,
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_project_type_state (project_id, issue_type, state_key),
        KEY idx_project_type (project_id, issue_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    // 插入默认状态配置
    await this.insertDefaultStates(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS project_issue_states`);
  }

  private async insertDefaultStates(queryRunner: QueryRunner): Promise<void> {
    // 获取所有项目ID
    const projects = await queryRunner.query(`SELECT id FROM projects`);
    
    const defaultStates = {
      requirement: [
        { key: 'draft', name: '草稿', color: '#d9d9d9', isInitial: true, sortOrder: 0 },
        { key: 'pending_review', name: '待评审', color: '#faad14', isInitial: false, sortOrder: 1 },
        { key: 'reviewing', name: '评审中', color: '#1890ff', isInitial: false, sortOrder: 2 },
        { key: 'approved', name: '已通过', color: '#52c41a', isInitial: false, sortOrder: 3 },
        { key: 'in_development', name: '开发中', color: '#722ed1', isInitial: false, sortOrder: 4 },
        { key: 'completed', name: '已完成', color: '#13c2c2', isInitial: false, sortOrder: 5 },
        { key: 'closed', name: '已关闭', color: '#8c8c8c', isInitial: false, isFinal: true, sortOrder: 6 }
      ],
      task: [
        { key: 'todo', name: '待办', color: '#d9d9d9', isInitial: true, sortOrder: 0 },
        { key: 'in_progress', name: '进行中', color: '#1890ff', isInitial: false, sortOrder: 1 },
        { key: 'done', name: '已完成', color: '#52c41a', isInitial: false, sortOrder: 2 },
        { key: 'closed', name: '已关闭', color: '#8c8c8c', isInitial: false, isFinal: true, sortOrder: 3 }
      ],
      bug: [
        { key: 'new', name: '新建', color: '#d9d9d9', isInitial: true, sortOrder: 0 },
        { key: 'confirmed', name: '已确认', color: '#faad14', isInitial: false, sortOrder: 1 },
        { key: 'fixing', name: '修复中', color: '#1890ff', isInitial: false, sortOrder: 2 },
        { key: 'testing', name: '待测试', color: '#722ed1', isInitial: false, sortOrder: 3 },
        { key: 'fixed', name: '已修复', color: '#52c41a', isInitial: false, sortOrder: 4 },
        { key: 'closed', name: '已关闭', color: '#8c8c8c', isInitial: false, isFinal: true, sortOrder: 5 }
      ]
    };

    for (const project of projects) {
      for (const [issueType, states] of Object.entries(defaultStates)) {
        for (const state of states) {
          const id = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await queryRunner.query(`
            INSERT INTO project_issue_states 
            (id, project_id, issue_type, state_key, state_name, color, is_initial, is_final, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id,
            project.id,
            issueType,
            state.key,
            state.name,
            state.color,
            state.isInitial ? 1 : 0,
            state.isFinal ? 1 : 0,
            state.sortOrder
          ]);
        }
      }
    }
  }
}
