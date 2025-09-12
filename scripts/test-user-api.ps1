# 测试用户API接口
Write-Host "测试用户API接口..." -ForegroundColor Green

# 设置API基础URL
$baseUrl = "http://localhost:3000"

# 测试获取用户列表
Write-Host "`n1. 测试获取用户列表..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET -Headers @{
        "Authorization" = "Bearer YOUR_JWT_TOKEN"
        "Content-Type" = "application/json"
    }
    Write-Host "用户列表API响应:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "用户列表API错误: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试获取项目成员（需要替换为实际的项目ID）
Write-Host "`n2. 测试获取项目成员..." -ForegroundColor Yellow
$projectId = "YOUR_PROJECT_ID"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members" -Method GET -Headers @{
        "Authorization" = "Bearer YOUR_JWT_TOKEN"
        "Content-Type" = "application/json"
    }
    Write-Host "项目成员API响应:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "项目成员API错误: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n测试完成！" -ForegroundColor Green
Write-Host "请确保:" -ForegroundColor Cyan
Write-Host "1. 后端服务正在运行 (npm run start:dev)" -ForegroundColor White
Write-Host "2. 数据库连接正常" -ForegroundColor White
Write-Host "3. 替换YOUR_JWT_TOKEN为有效的JWT令牌" -ForegroundColor White
Write-Host "4. 替换YOUR_PROJECT_ID为实际的项目ID" -ForegroundColor White
