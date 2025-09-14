const jwt = require('jsonwebtoken');

// 测试admin用户权限豁免功能
async function testAdminPermissions() {
  console.log('🧪 测试admin用户权限豁免功能...\n');

  try {
    // 模拟demo管理员用户登录请求（先测试现有用户）
    const loginData = {
      email: 'demo_manager@example.com',
      password: 'demo123456'
    };

    console.log('📤 发送admin用户登录请求...');
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    if (!response.ok) {
      throw new Error(`登录失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Demo管理员用户登录成功');
    console.log('📋 用户信息:', {
      id: result.data?.user?.id || result.user?.id,
      email: result.data?.user?.email || result.user?.email,
      name: result.data?.user?.name || result.user?.name,
      roles: result.data?.user?.roles || result.user?.roles
    });

    // 解析JWT token验证角色信息
    const token = result.data?.accessToken || result.accessToken;
    const decoded = jwt.decode(token);
    
    console.log('\n🔍 JWT Payload解析:');
    console.log('  - 用户ID (sub):', decoded.sub);
    console.log('  - 邮箱 (email):', decoded.email);
    console.log('  - 角色 (roles):', decoded.roles);

    // 测试admin用户访问需要admin权限的GitLab集成端点
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

    // 测试admin用户访问需要项目管理员权限的端点
    console.log('\n🔐 测试admin用户访问项目管理员权限端点...');
    
    const projectEndpoints = [
      { method: 'GET', url: '/api/v1/gitlab/instances/test-instance/projects', name: '获取GitLab项目列表' }
    ];

    for (const endpoint of projectEndpoints) {
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

// 运行测试
testAdminPermissions();
