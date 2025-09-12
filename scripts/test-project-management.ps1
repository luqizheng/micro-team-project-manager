# 测试项目管理和用户关联功能
Write-Host "测试项目管理和用户关联功能..." -ForegroundColor Green

Write-Host "`n1. 启动后端服务..." -ForegroundColor Yellow
Write-Host "请在新终端中运行:" -ForegroundColor Cyan
Write-Host "cd server" -ForegroundColor White
Write-Host "npm run start:dev" -ForegroundColor White

Write-Host "`n2. 启动前端服务..." -ForegroundColor Yellow
Write-Host "请在新终端中运行:" -ForegroundColor Cyan
Write-Host "cd client" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White

Write-Host "`n3. 测试功能点:" -ForegroundColor Yellow

Write-Host "`n✅ 后端API端点:" -ForegroundColor Green
Write-Host "- GET /projects - 获取项目列表" -ForegroundColor White
Write-Host "- POST /projects - 创建项目" -ForegroundColor White
Write-Host "- GET /projects/:id - 获取项目详情" -ForegroundColor White
Write-Host "- PATCH /projects/:id - 更新项目" -ForegroundColor White
Write-Host "- DELETE /projects/:id - 删除项目" -ForegroundColor White
Write-Host "- GET /projects/:id/members - 获取项目成员" -ForegroundColor White
Write-Host "- POST /projects/:id/members - 添加项目成员" -ForegroundColor White
Write-Host "- PATCH /projects/:id/members/:userId - 更新成员角色" -ForegroundColor White
Write-Host "- DELETE /projects/:id/members/:userId - 移除项目成员" -ForegroundColor White

Write-Host "`n✅ 前端页面:" -ForegroundColor Green
Write-Host "- /projects - 项目列表页面（带新建/编辑功能）" -ForegroundColor White
Write-Host "- /projects/:id - 项目详情页面（带成员管理）" -ForegroundColor White
Write-Host "- 项目成员管理组件（添加/编辑/删除成员）" -ForegroundColor White

Write-Host "`n✅ 功能特性:" -ForegroundColor Green
Write-Host "- 项目CRUD操作（创建、读取、更新、删除）" -ForegroundColor White
Write-Host "- 项目成员管理（添加、角色变更、移除）" -ForegroundColor White
Write-Host "- 用户选择组件（支持搜索和选择）" -ForegroundColor White
Write-Host "- 权限控制（基于角色的访问控制）" -ForegroundColor White
Write-Host "- 响应式设计（适配不同屏幕尺寸）" -ForegroundColor White

Write-Host "`n4. 测试步骤:" -ForegroundColor Yellow
Write-Host "1. 访问 http://localhost:5173/projects" -ForegroundColor White
Write-Host "2. 点击'新建项目'创建项目" -ForegroundColor White
Write-Host "3. 点击'详情'查看项目详情" -ForegroundColor White
Write-Host "4. 在项目详情页面管理成员" -ForegroundColor White
Write-Host "5. 测试编辑和删除功能" -ForegroundColor White

Write-Host "`n5. 注意事项:" -ForegroundColor Yellow
Write-Host "- 确保数据库服务正在运行" -ForegroundColor White
Write-Host "- 确保已创建用户账户" -ForegroundColor White
Write-Host "- 确保有适当的权限角色" -ForegroundColor White
Write-Host "- 检查控制台是否有错误信息" -ForegroundColor White

Write-Host "`n6. 故障排除:" -ForegroundColor Yellow
Write-Host "- 如果API调用失败，检查后端服务状态" -ForegroundColor White
Write-Host "- 如果页面显示异常，检查浏览器控制台" -ForegroundColor White
Write-Host "- 如果权限问题，检查用户角色配置" -ForegroundColor White
Write-Host "- 如果数据库错误，检查连接配置" -ForegroundColor White
