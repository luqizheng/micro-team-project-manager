const { DataSource } = require('typeorm');
const crypto = require('crypto');

// 创建TypeORM数据源
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'project_manager',
  entities: ['src/modules/**/*.entity.ts'],
  synchronize: false,
  logging: true,
});

async function createAdminUser() {
  console.log('🔧 创建admin用户...');

  try {
    // 初始化数据源
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    // 获取用户实体
    const UserEntity = dataSource.getRepository('UserEntity');

    // 检查admin用户是否已存在
    const existingAdmin = await UserEntity.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin用户已存在');
      console.log('📋 用户信息:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name,
        systemRoles: existingAdmin.systemRoles
      });
      return existingAdmin;
    }

    // 创建admin用户
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
    
    const adminUser = await UserEntity.save({
      email: 'admin@example.com',
      name: 'admin',
      displayName: '系统管理员',
      passwordHash: passwordHash,
      status: 'active',
      systemRoles: ['admin']
    });

    console.log('✅ Admin用户创建成功');
    console.log('📋 用户信息:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      systemRoles: adminUser.systemRoles
    });

    return adminUser;

  } catch (error) {
    console.error('❌ 创建admin用户失败:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// 运行创建admin用户
createAdminUser();
