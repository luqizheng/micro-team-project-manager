const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testKanban() {
  try {
    console.log('🚀 开始测试看板功能...\n');

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

    // 2. 获取项目列表
    console.log('2. 获取项目列表...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, { headers });

    console.log('-----------------',projectsResponse.data, 'projects');
    const projects = projectsResponse.data.items;

    if (projects.length === 0) {
      console.log('❌ 没有找到项目');
      return;
    }

    const project = projects[0];
    console.log(`✅ 找到项目: ${project.name} (${project.key})\n`);

    // 3. 获取项目看板列表
    console.log('3. 获取项目看板列表...');
    const boardsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/boards`, { headers });
    const boards = boardsResponse.data;
    
    if (boards.length === 0) {
      console.log('❌ 没有找到看板');
      return;
    }

    const board = boards[0];
    console.log(`✅ 找到看板: ${board.name} (${board.id})\n`);

    // 4. 测试看板数据获取
    console.log('4. 测试看板数据获取...');
    const kanbanResponse = await axios.get(`${BASE_URL}/projects/${project.id}/boards/${board.id}/kanban`, { headers });
    const kanbanData = kanbanResponse.data;
    
    console.log('✅ 看板数据获取成功!');
    console.log(`   看板名称: ${kanbanData.name}`);
    console.log(`   列数量: ${kanbanData.columns?.length || 0}`);
    
    if (kanbanData.columns && kanbanData.columns.length > 0) {
      console.log('\n📋 看板列信息:');
      kanbanData.columns.forEach((column, index) => {
        console.log(`   ${index + 1}. ${column.name} (${column.stateMapping}) - ${column.issues?.length || 0} 个事项`);
      });
    }

    console.log('\n🎉 看板功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('错误详情:', error.response.data.message);
    }
  }
}

// 运行测试
testKanban();
