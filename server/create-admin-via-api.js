const jwt = require('jsonwebtoken');

// 通过API创建admin用户
async function createAdminViaAPI() {
  console.log('🔧 通过API创建admin用户...\n');

  try {
    // 首先使用demo管理员用户登录
    const loginData = {
      email: 'demo_manager@example.com',
      password: 'demo123456'
    };

    console.log('📤 使用demo管理员用户登录...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginResult = await loginResponse.json();
    const token = loginResult.data?.accessToken || loginResult.accessToken;
    
    console.log('✅ Demo管理员用户登录成功');

    // 创建admin用户
    const adminUserData = {
      email: 'admin@example.com',
      name: 'admin',
      password: 'admin123',
      systemRoles: ['admin']
    };

    console.log('📤 创建admin用户...');
    const createResponse = await fetch('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminUserData)
    });

    if (createResponse.ok) {
      const adminResult = await createResponse.json();
      console.log('✅ Admin用户创建成功');
      console.log('📋 Admin用户信息:', {
        id: adminResult.data?.id || adminResult.id,
        email: adminResult.data?.email || adminResult.email,
        name: adminResult.data?.name || adminResult.name,
        systemRoles: adminResult.data?.systemRoles || adminResult.systemRoles
      });
    } else {
      const errorText = await createResponse.text();
      console.log('❌ 创建admin用户失败:', createResponse.status, errorText);
      
      // 如果创建失败，可能是因为权限问题，让我们尝试直接测试admin权限豁免
      console.log('\n🔍 测试admin权限豁免功能...');
      await testAdminPermissionBypass();
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
}

// 测试admin权限豁免功能
async function testAdminPermissionBypass() {
  console.log('\n🧪 测试admin权限豁免功能...');

  try {
    // 模拟admin用户登录（使用硬编码的admin用户信息）
    const adminLoginData = {
      email: 'admin@example.com',
      password: 'admin123456'
    };

    console.log('📤 尝试admin用户登录...');
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminLoginData)
    });

    if (!response.ok) {
      console.log('❌ Admin用户登录失败，可能用户不存在');
      return;
    }

    const result = await response.json();
    const token = result.data?.accessToken || result.accessToken;
    const decoded = jwt.decode(token);
    
    console.log('✅ Admin用户登录成功');
    console.log('📋 Admin用户信息:', {
      id: result.data?.user?.id || result.user?.id,
      email: result.data?.user?.email || result.user?.email,
      name: result.data?.user?.name || result.user?.name,
      roles: result.data?.user?.roles || result.user?.roles
    });

    console.log('\n🔍 JWT Payload解析:');
    console.log('  - 用户ID (sub):', decoded.sub);
    console.log('  - 邮箱 (email):', decoded.email);
    console.log('  - 角色 (roles):', decoded.roles);

    // 测试admin用户访问需要admin权限的端点
    console.log('\n🔐 测试admin用户访问GitLab集成端点...');
    
    const testEndpoints = [
      { method: 'GET', url: '/api/v1/gitlab/instances', name: '获取GitLab实例列表' },
      { method: 'GET', url: '/api/v1/gitlab/statistics', name: '获取同步统计信息' },
      { method: 'GET', url: '/api/v1/gitlab/events/statistics', name: '获取事件处理统计' },
      { method: 'GET', url: '/api/v1/gitlab/events/health', name: '获取事件处理健康状态' }
    ];

    for (const endpoint of testEndpoints) {
      console.log(`\n📡 测试 ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
      
      const testResponse = await fetch(`http://localhost:3000${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        console.log('✅ 访问成功 - admin权限豁免生效');
        const data = await testResponse.json();
        console.log('📊 响应数据:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
      } else {
        console.log(`❌ 访问失败: ${testResponse.status} ${testResponse.statusText}`);
        const errorText = await testResponse.text();
        console.log('📄 错误详情:', errorText);
      }
    }

    console.log('\n🎉 Admin权限豁免功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行创建admin用户
createAdminViaAPI();
