# 修复用户列表加载问题
Write-Host "修复用户列表加载问题..." -ForegroundColor Green

# 1. 检查后端服务是否运行
Write-Host "`n1. 检查后端服务状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ 后端服务正在运行" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ 后端服务未运行，请先启动后端服务" -ForegroundColor Red
    Write-Host "  运行命令: cd server && npm run start:dev" -ForegroundColor Cyan
    exit 1
}

# 2. 检查数据库连接
Write-Host "`n2. 检查数据库连接..." -ForegroundColor Yellow
Write-Host "请确保数据库服务正在运行，并且连接配置正确" -ForegroundColor Cyan

# 3. 检查必要的表是否存在
Write-Host "`n3. 检查数据库表..." -ForegroundColor Yellow
Write-Host "请确保以下表存在:" -ForegroundColor Cyan
Write-Host "  - users (用户表)" -ForegroundColor White
Write-Host "  - projects (项目表)" -ForegroundColor White
Write-Host "  - memberships (成员关系表)" -ForegroundColor White

# 4. 检查权限配置
Write-Host "`n4. 检查权限配置..." -ForegroundColor Yellow
Write-Host "确保用户有以下角色之一:" -ForegroundColor Cyan
Write-Host "  - admin (全局管理员)" -ForegroundColor White
Write-Host "  - project_manager (项目经理)" -ForegroundColor White
Write-Host "  - member (项目成员)" -ForegroundColor White

# 5. 测试API接口
Write-Host "`n5. 测试API接口..." -ForegroundColor Yellow
Write-Host "请手动测试以下接口:" -ForegroundColor Cyan
Write-Host "  GET /users" -ForegroundColor White
Write-Host "  GET /projects/{projectId}/members" -ForegroundColor White

# 6. 重启服务
Write-Host "`n6. 重启服务..." -ForegroundColor Yellow
Write-Host "如果问题仍然存在，请尝试:" -ForegroundColor Cyan
Write-Host "  1. 重启后端服务" -ForegroundColor White
Write-Host "  2. 清除浏览器缓存" -ForegroundColor White
Write-Host "  3. 检查控制台错误信息" -ForegroundColor White

Write-Host "`n修复完成！" -ForegroundColor Green
Write-Host "如果问题仍然存在，请查看详细的问题排查文档:" -ForegroundColor Cyan
Write-Host "docs/项目管理工具/功能说明/用户列表加载问题排查.md" -ForegroundColor White
