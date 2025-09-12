const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testIssueKeyGeneration() {
  try {
    console.log('🚀 开始测试Issue Key生成功能...\n');

    // 1. 登录获取token
    console.log('1. 登录获取认证token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: '1qaz2wsx'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. 创建一个测试项目
    console.log('2. 创建测试项目...');
    const projectResponse = await axios.post(`${BASE_URL}/projects`, {
      key: 'TEST',
      name: '测试项目',
      visibility: 'private',
      createdBy: 'test-user-id'
    }, { headers });

    const projectId = projectResponse.data.id;
    console.log(`✅ 项目创建成功: ${projectResponse.data.key} (ID: ${projectId})\n`);

    // 3. 创建多个issues测试key生成
    console.log('3. 创建issues测试key生成...');
    const issues = [];
    
    for (let i = 1; i <= 5; i++) {
      const issueResponse = await axios.post(`${BASE_URL}/projects/${projectId}/issues`, {
        type: 'task',
        title: `测试任务 ${i}`,
        description: `这是第 ${i} 个测试任务`,
        reporterId: 'test-user-id'
      }, { headers });

      issues.push(issueResponse.data);
      console.log(`✅ Issue ${i} 创建成功: ${issueResponse.data.key}`);
    }

    console.log('\n4. 验证生成的keys:');
    issues.forEach((issue, index) => {
      const expectedKey = `TEST_${index + 1}`;
      const actualKey = issue.key;
      const isCorrect = actualKey === expectedKey;
      console.log(`   Issue ${index + 1}: ${actualKey} ${isCorrect ? '✅' : '❌'} (期望: ${expectedKey})`);
    });

    // 5. 测试不同issue类型
    console.log('\n5. 测试不同issue类型的key生成...');
    const bugResponse = await axios.post(`${BASE_URL}/projects/${projectId}/issues`, {
      type: 'bug',
      title: '测试Bug',
      description: '这是一个测试bug',
      reporterId: 'test-user-id'
    }, { headers });

    const requirementResponse = await axios.post(`${BASE_URL}/projects/${projectId}/issues`, {
      type: 'requirement',
      title: '测试需求',
      description: '这是一个测试需求',
      reporterId: 'test-user-id'
    }, { headers });

    console.log(`✅ Bug创建成功: ${bugResponse.data.key}`);
    console.log(`✅ 需求创建成功: ${requirementResponse.data.key}`);

    // 6. 验证所有issues的key
    console.log('\n6. 获取项目所有issues验证key...');
    const allIssuesResponse = await axios.get(`${BASE_URL}/projects/${projectId}/issues`, { headers });
    const allIssues = allIssuesResponse.data.items;

    console.log('\n📋 所有Issues的Key列表:');
    allIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.key} - ${issue.title} (${issue.type})`);
    });

    // 7. 验证key的唯一性
    const keys = allIssues.map(issue => issue.key);
    const uniqueKeys = [...new Set(keys)];
    const isUnique = keys.length === uniqueKeys.length;
    
    console.log(`\n🔍 Key唯一性检查: ${isUnique ? '✅ 所有keys都是唯一的' : '❌ 发现重复的keys'}`);

    // 8. 验证key格式
    const keyPattern = /^TEST_\d+$/;
    const allKeysValid = allIssues.every(issue => keyPattern.test(issue.key));
    console.log(`🔍 Key格式检查: ${allKeysValid ? '✅ 所有keys格式正确' : '❌ 发现格式错误的keys'}`);

    console.log('\n🎉 Issue Key生成功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testIssueKeyGeneration();
