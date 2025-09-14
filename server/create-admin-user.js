const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 创建admin用户...');

  try {
    // 检查admin用户是否已存在
    const existingAdmin = await prisma.user.findFirst({
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
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'admin',
        displayName: '系统管理员',
        passwordHash: passwordHash,
        status: 'active',
        systemRoles: ['admin']
      }
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
    await prisma.$disconnect();
  }
}

// 运行创建admin用户
createAdminUser();
