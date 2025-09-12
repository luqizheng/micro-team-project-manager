# 测试Issues PUT方法
Write-Host "测试Issues PUT方法..." -ForegroundColor Green

# 设置变量
$baseUrl = "http://localhost:3000"
$projectId = "0b122ef1-f073-4520-b5d6-e1e26ea05c56"
$issueId = "6c82f09c-15c8-408b-990f-9b95e3ac8e85"

Write-Host "`n1. 测试GET方法（检查Issue是否存在）..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId" -Method GET
    Write-Host "✅ Issue存在: $($getResponse.title)" -ForegroundColor Green
} catch {
    Write-Host "❌ GET请求失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "- 后端服务是否运行" -ForegroundColor White
    Write-Host "- Issue ID是否正确" -ForegroundColor White
    Write-Host "- 数据库连接是否正常" -ForegroundColor White
    exit 1
}

Write-Host "`n2. 测试PUT方法..." -ForegroundColor Yellow

# 准备PUT请求数据
$putData = @{
    type = "task"
    title = "更新后的Issue标题"
    description = "这是一个更新后的Issue描述"
    state = "in_progress"
    priority = "high"
    severity = "medium"
    assigneeId = $null
    reporterId = $null
    storyPoints = 5
    estimatedHours = 8.5
    actualHours = 2.0
    labels = @("bug", "urgent")
    dueAt = "2024-12-31T23:59:59.000Z"
} | ConvertTo-Json -Depth 3

Write-Host "PUT请求数据:" -ForegroundColor Cyan
Write-Host $putData -ForegroundColor White

try {
    $putResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId" -Method PUT -Body $putData -ContentType "application/json"
    Write-Host "✅ PUT请求成功!" -ForegroundColor Green
    Write-Host "更新后的Issue信息:" -ForegroundColor Cyan
    Write-Host "标题: $($putResponse.title)" -ForegroundColor White
    Write-Host "状态: $($putResponse.state)" -ForegroundColor White
    Write-Host "优先级: $($putResponse.priority)" -ForegroundColor White
    Write-Host "预估工时: $($putResponse.estimatedHours)" -ForegroundColor White
} catch {
    Write-Host "❌ PUT请求失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n3. 验证更新结果..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId" -Method GET
    Write-Host "✅ 验证成功!" -ForegroundColor Green
    Write-Host "当前Issue信息:" -ForegroundColor Cyan
    Write-Host "标题: $($verifyResponse.title)" -ForegroundColor White
    Write-Host "状态: $($verifyResponse.state)" -ForegroundColor White
    Write-Host "优先级: $($verifyResponse.priority)" -ForegroundColor White
    Write-Host "预估工时: $($verifyResponse.estimatedHours)" -ForegroundColor White
    Write-Host "标签: $($verifyResponse.labels -join ', ')" -ForegroundColor White
} catch {
    Write-Host "❌ 验证失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. 测试PATCH方法（对比）..." -ForegroundColor Yellow
$patchData = @{
    title = "PATCH更新的标题"
    state = "done"
} | ConvertTo-Json

try {
    $patchResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId" -Method PATCH -Body $patchData -ContentType "application/json"
    Write-Host "✅ PATCH请求成功!" -ForegroundColor Green
    Write-Host "PATCH更新后的标题: $($patchResponse.title)" -ForegroundColor White
} catch {
    Write-Host "❌ PATCH请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. API端点总结:" -ForegroundColor Yellow
Write-Host "GET    /projects/:projectId/issues/:id     - 获取Issue详情" -ForegroundColor White
Write-Host "PUT    /projects/:projectId/issues/:id     - 完整更新Issue" -ForegroundColor Green
Write-Host "PATCH  /projects/:projectId/issues/:id     - 部分更新Issue" -ForegroundColor White
Write-Host "DELETE /projects/:projectId/issues/:id     - 删除Issue" -ForegroundColor White

Write-Host "`n6. 注意事项:" -ForegroundColor Yellow
Write-Host "- PUT方法需要提供所有必需字段" -ForegroundColor White
Write-Host "- PATCH方法只需要提供要更新的字段" -ForegroundColor White
Write-Host "- 确保提供有效的JWT令牌" -ForegroundColor White
Write-Host "- 检查用户权限（member或project_manager）" -ForegroundColor White
