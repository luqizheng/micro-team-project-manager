# 测试Demo数据初始化功能
Write-Host "🚀 启动项目管理系统并测试Demo数据初始化..." -ForegroundColor Green

# 切换到项目目录
Set-Location "D:\projects\project-manager"

# 启动服务
Write-Host "📦 启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd server; npm run start" -WindowStyle Minimized

# 等待服务启动
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 测试Demo数据
Write-Host "🔍 测试Demo数据..." -ForegroundColor Yellow
Set-Location "server"
node test-demo-data.js

Write-Host "✅ 测试完成！" -ForegroundColor Green
Write-Host "📝 可以使用以下账户登录系统：" -ForegroundColor Cyan
Write-Host "   - demo_user@example.com / demo123456" -ForegroundColor White
Write-Host "   - demo_manager@example.com / demo123456" -ForegroundColor White
Write-Host "   - 项目Key: DEMO" -ForegroundColor White
