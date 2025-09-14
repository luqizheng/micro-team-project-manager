const mysql = require('mysql2/promise');

// 更新用户角色为admin
async function updateUserRole() {
  console.log('🔧 更新demo_manager用户角色为admin...\n');

  let connection;
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: '192.168.2.134',
      port: 3306,
      user: 'root',
      password: 'Ewq321#@!',
      database: 'project_manager'
    });

    console.log('✅ 数据库连接成功');

    // 查找demo_manager用户
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['demo_manager@example.com']
    );

    if (users.length === 0) {
      console.log('❌ 找不到demo_manager用户');
      return;
    }

    const user = users[0];
    console.log('📋 当前用户信息:', {
      id: user.id,
      email: user.email,
      name: user.name,
      systemRoles: user.systemRoles
    });

    // 更新用户角色为admin
    await connection.execute(
      'UPDATE users SET systemRoles = ? WHERE id = ?',
      [JSON.stringify(['admin']), user.id]
    );

    console.log('✅ 用户角色更新成功');

    // 验证更新结果
    const [updatedUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['demo_manager@example.com']
    );

    const updatedUser = updatedUsers[0];
    console.log('📋 更新后用户信息:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      systemRoles: updatedUser.systemRoles
    });

  } catch (error) {
    console.error('❌ 更新用户角色失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行更新用户角色
updateUserRole();
