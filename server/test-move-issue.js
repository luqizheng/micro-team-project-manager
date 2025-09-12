const axios = require('axios');

async function testMoveIssue() {
  try {
    // 1. 登录获取token
    console.log('1. 登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@admin.com',
      password: '1qaz2wsx'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('登录成功，token:', token.substring(0, 20) + '...');

    // 2. 获取项目列表
    console.log('\n2. 获取项目列表...');
    const projectsResponse = await axios.get('http://localhost:3000/api/v1/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projectId = projectsResponse.data.data.items[0].id;
    console.log('项目ID:', projectId);

    // 3. 获取看板列表
    console.log('\n3. 获取看板列表...');
    const boardsResponse = await axios.get(`http://localhost:3000/api/v1/projects/${projectId}/boards`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const boardId = boardsResponse.data.data[0].id;
    console.log('看板ID:', boardId);

    // 4. 获取看板详情
    console.log('\n4. 获取看板详情...');
    const boardResponse = await axios.get(`http://localhost:3000/api/v1/projects/${projectId}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('看板列:', boardResponse.data.data.columns.map(col => ({ id: col.id, name: col.name, stateMapping: col.stateMapping })));

    // 5. 获取看板事项
    console.log('\n5. 获取看板事项...');
    const kanbanResponse = await axios.get(`http://localhost:3000/api/v1/projects/${projectId}/boards/${boardId}/kanban`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('看板数据:', JSON.stringify(kanbanResponse.data, null, 2));

    // 6. 测试移动事项
    console.log('\n6. 测试移动事项...');
    const issues = kanbanResponse.data.data.columns.find(col => col.name === '待办')?.issues || [];
    if (issues.length > 0) {
      const issueId = issues[0].id;
      const targetColumn = kanbanResponse.data.data.columns.find(col => col.name === '进行中');
      
      console.log('事项ID:', issueId);
      console.log('目标列ID:', targetColumn?.id);
      
      if (targetColumn) {
        const moveResponse = await axios.put(`http://localhost:3000/api/v1/projects/${projectId}/boards/move-issue`, {
          issueId: issueId,
          columnId: targetColumn.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('移动成功:', moveResponse.data);
      }
    }

  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误信息:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMoveIssue();
