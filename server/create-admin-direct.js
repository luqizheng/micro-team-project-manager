const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function createAdminUser() {
  console.log('🔧 直接创建admin用户...');

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

    // 检查admin用户是否已存在
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if (existingUsers.length > 0) {
      console.log('✅ Admin用户已存在');
      console.log('📋 用户信息:', {
        id: existingUsers[0].id,
        email: existingUsers[0].email,
        name: existingUsers[0].name,
        systemRoles: existingUsers[0].systemRoles
      });
      return existingUsers[0];
    }

    // 创建admin用户
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
    const userId = crypto.randomUUID();
    
    await connection.execute(
      `INSERT INTO users (id, email, name, display_name, password_hash, status, system_roles, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        'admin@example.com',
        'admin',
        '系统管理员',
        passwordHash,
        'active',
        JSON.stringify(['admin'])
      ]
    );

    console.log('✅ Admin用户创建成功');
    console.log('📋 用户信息:', {
      id: userId,
      email: 'admin@example.com',
      name: 'admin',
      systemRoles: ['admin']
    });

    return { id: userId, email: 'admin@example.com', name: 'admin', systemRoles: ['admin'] };

  } catch (error) {
    console.error('❌ 创建admin用户失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行创建admin用户
createAdminUser();
