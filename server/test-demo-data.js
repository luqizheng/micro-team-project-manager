const mysql = require('mysql2/promise');

async function testDemoData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'project_manager'
  });

  try {
    console.log('🔍 检查Demo数据...\n');

    // 检查用户
    console.log('👥 用户列表:');
    const [users] = await connection.execute('SELECT id, email, name, display_name, system_roles FROM users WHERE email LIKE "%demo%"');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - 角色: ${user.system_roles || '[]'}`);
    });

    // 检查项目
    console.log('\n📁 项目列表:');
    const [projects] = await connection.execute('SELECT id, key, name, visibility FROM projects WHERE key = "DEMO"');
    projects.forEach(project => {
      console.log(`  - ${project.key}: ${project.name} (${project.visibility})`);
    });

    // 检查项目成员
    if (projects.length > 0) {
      console.log('\n👥 项目成员:');
      const [members] = await connection.execute(`
        SELECT u.name, u.email, m.role 
        FROM memberships m 
        JOIN users u ON u.id = m.user_id 
        WHERE m.project_id = ?
      `, [projects[0].id]);
      members.forEach(member => {
        console.log(`  - ${member.name} (${member.email}) - 角色: ${member.role}`);
      });
    }

    // 检查Issue状态
    if (projects.length > 0) {
      console.log('\n📊 Issue状态:');
      const [states] = await connection.execute(`
        SELECT issue_type, state_key, state_name, color, is_initial, is_final 
        FROM project_issue_states 
        WHERE project_id = ? 
        ORDER BY issue_type, sort_order
      `, [projects[0].id]);
      
      let currentType = '';
      states.forEach(state => {
        if (state.issue_type !== currentType) {
          currentType = state.issue_type;
          console.log(`  ${currentType}:`);
        }
        const flags = [];
        if (state.is_initial) flags.push('初始');
        if (state.is_final) flags.push('最终');
        console.log(`    - ${state.state_name} (${state.state_key}) ${flags.length ? `[${flags.join(', ')}]` : ''}`);
      });
    }

    // 检查Issues
    if (projects.length > 0) {
      console.log('\n📋 Issues列表:');
      const [issues] = await connection.execute(`
        SELECT i.key, i.type, i.title, i.state, i.priority, i.story_points, i.estimated_hours, i.actual_hours,
               assignee.name as assignee_name, reporter.name as reporter_name
        FROM issues i
        LEFT JOIN users assignee ON assignee.id = i.assignee_id
        LEFT JOIN users reporter ON reporter.id = i.reporter_id
        WHERE i.project_id = ?
        ORDER BY i.key
      `, [projects[0].id]);
      
      issues.forEach(issue => {
        const hours = issue.actual_hours ? `(${issue.estimated_hours}h/${issue.actual_hours}h)` : `(${issue.estimated_hours}h)`;
        const assignee = issue.assignee_name ? ` -> ${issue.assignee_name}` : '';
        console.log(`  - ${issue.key}: ${issue.title} [${issue.type}] ${issue.state} ${issue.priority} ${hours}${assignee}`);
      });

      // 统计信息
      console.log('\n📈 统计信息:');
      const [stats] = await connection.execute(`
        SELECT 
          type,
          COUNT(*) as count,
          SUM(estimated_hours) as total_estimated,
          SUM(actual_hours) as total_actual
        FROM issues 
        WHERE project_id = ? 
        GROUP BY type
      `, [projects[0].id]);
      
      stats.forEach(stat => {
        console.log(`  ${stat.type}: ${stat.count}个, 预估${stat.total_estimated}h, 实际${stat.total_actual || 0}h`);
      });
    }

    console.log('\n✅ Demo数据检查完成!');
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await connection.end();
  }
}

testDemoData();
