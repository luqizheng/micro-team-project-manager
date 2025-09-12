# 测试SQL调试功能
Write-Host "测试SQL调试功能..." -ForegroundColor Green

# 设置环境变量
$env:NODE_ENV = "development"

Write-Host "`n1. 启动后端服务（带SQL调试）..." -ForegroundColor Yellow
Write-Host "请在新终端中运行以下命令:" -ForegroundColor Cyan
Write-Host "cd server" -ForegroundColor White
Write-Host "npm run start:dev" -ForegroundColor White

Write-Host "`n2. 等待服务启动后，在另一个终端中运行以下测试命令:" -ForegroundColor Yellow

Write-Host "`n测试用户列表API:" -ForegroundColor Cyan
Write-Host "curl -X GET `"http://localhost:3000/users`" -H `"Authorization: Bearer YOUR_JWT_TOKEN`"" -ForegroundColor White

Write-Host "`n测试项目成员API:" -ForegroundColor Cyan
Write-Host "curl -X GET `"http://localhost:3000/projects/PROJECT_ID/members`" -H `"Authorization: Bearer YOUR_JWT_TOKEN`"" -ForegroundColor White

Write-Host "`n3. 观察控制台输出，应该看到类似以下的SQL日志:" -ForegroundColor Yellow
Write-Host "🔍 Query: SELECT ..." -ForegroundColor Green
Write-Host "📊 Parameters: [...]" -ForegroundColor Green
Write-Host "⏰ Slow Query (1000ms): ..." -ForegroundColor Yellow

Write-Host "`n4. 如果看到SQL日志输出，说明调试功能配置成功！" -ForegroundColor Green

Write-Host "`n注意事项:" -ForegroundColor Yellow
Write-Host "- 确保数据库服务正在运行" -ForegroundColor White
Write-Host "- 确保环境变量NODE_ENV=development" -ForegroundColor White
Write-Host "- 确保有有效的JWT令牌" -ForegroundColor White
Write-Host "- 确保有有效的项目ID" -ForegroundColor White
