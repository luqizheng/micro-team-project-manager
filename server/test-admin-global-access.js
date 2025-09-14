const jwt = require('jsonwebtoken');

// 测试admin用户全局权限豁免功能
async function testAdminGlobalAccess() {
  console.log('🧪 测试admin用户全局权限豁免功能...\n');

  try {
    // 模拟admin用户登录请求
    const loginData = {
      email: 'admin@example.com',
      password: 'admin123456'
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
      console.log('❌ Admin用户登录失败，尝试使用demo管理员用户...');
      
      // 如果admin用户不存在，使用demo管理员用户
      const demoLoginData = {
        email: 'demo_manager@example.com',
        password: 'demo123456'
      };

      const demoResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoLoginData)
      });

      if (!demoResponse.ok) {
        throw new Error(`Demo用户登录失败: ${demoResponse.status} ${demoResponse.statusText}`);
      }

      const demoResult = await demoResponse.json();
      console.log('✅ Demo管理员用户登录成功');
      console.log('📋 用户信息:', {
        id: demoResult.data?.user?.id || demoResult.user?.id,
        email: demoResult.data?.user?.email || demoResult.user?.email,
        name: demoResult.data?.user?.name || demoResult.user?.name,
        roles: demoResult.data?.user?.roles || demoResult.user?.roles
      });

      // 解析JWT token验证角色信息
      const token = demoResult.data?.accessToken || demoResult.accessToken;
      const decoded = jwt.decode(token);
      
      console.log('\n🔍 JWT Payload解析:');
      console.log('  - 用户ID (sub):', decoded.sub);
      console.log('  - 邮箱 (email):', decoded.email);
      console.log('  - 角色 (roles):', decoded.roles);

      // 测试demo管理员用户访问需要admin权限的GitLab集成端点
      console.log('\n🔐 测试demo管理员用户访问GitLab集成端点...');
      
      const testEndpoints = [
        { method: 'GET', url: '/api/v1/gitlab/instances', name: '获取GitLab实例列表', requiredRole: 'admin' },
        { method: 'GET', url: '/api/v1/gitlab/statistics', name: '获取同步统计信息', requiredRole: 'admin' },
        { method: 'GET', url: '/api/v1/gitlab/events/statistics', name: '获取事件处理统计', requiredRole: 'admin' },
        { method: 'GET', url: '/api/v1/gitlab/events/health', name: '获取事件处理健康状态', requiredRole: 'admin' },
        { method: 'GET', url: '/api/v1/gitlab/instances/test-instance/projects', name: '获取GitLab项目列表', requiredRole: 'project_manager' }
      ];

      for (const endpoint of testEndpoints) {
        console.log(`\n📡 测试 ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
        console.log(`   需要角色: ${endpoint.requiredRole}`);
        
        const testResponse = await fetch(`http://localhost:3000${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (testResponse.ok) {
          console.log('✅ 访问成功');
          const data = await testResponse.json();
          console.log('📊 响应数据:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
        } else {
          console.log(`❌ 访问失败: ${testResponse.status} ${testResponse.statusText}`);
          const errorText = await testResponse.text();
          console.log('📄 错误详情:', errorText);
        }
      }

      console.log('\n🎉 Demo管理员权限测试完成！');
      return;
    }

    const result = await response.json();
    console.log('✅ Admin用户登录成功');
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

    // 测试admin用户访问所有GitLab集成端点
    console.log('\n🔐 测试admin用户访问所有GitLab集成端点...');
    
    const testEndpoints = [
      { method: 'GET', url: '/api/v1/gitlab/instances', name: '获取GitLab实例列表' },
      { method: 'GET', url: '/api/v1/gitlab/statistics', name: '获取同步统计信息' },
      { method: 'GET', url: '/api/v1/gitlab/events/statistics', name: '获取事件处理统计' },
      { method: 'GET', url: '/api/v1/gitlab/events/health', name: '获取事件处理健康状态' },
      { method: 'GET', url: '/api/v1/gitlab/instances/test-instance/projects', name: '获取GitLab项目列表' }
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

    console.log('\n🎉 Admin全局权限豁免功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAdminGlobalAccess();
