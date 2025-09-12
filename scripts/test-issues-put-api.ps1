# 测试Issues PUT API方法
Write-Host "测试Issues PUT API方法..." -ForegroundColor Green

# 设置变量
$baseUrl = "http://localhost:3000"
$projectId = "0b122ef1-f073-4520-b5d6-e1e26ea05c56"
$issueId = "6c82f09c-15c8-408b-990f-9b95e3ac8e85"

Write-Host "`n1. 检查后端服务状态..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行，请先启动服务" -ForegroundColor Red
    Write-Host "启动命令: cd server && npm run start:dev" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n2. 测试GET方法（检查Issue是否存在）..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId" -Method GET
    Write-Host "✅ Issue存在: $($getResponse.title)" -ForegroundColor Green
    Write-Host "当前状态: $($getResponse.state)" -ForegroundColor White
} catch {
    Write-Host "❌ GET请求失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "可能原因:" -ForegroundColor Yellow
    Write-Host "- Issue不存在" -ForegroundColor White
    Write-Host "- 需要认证令牌" -ForegroundColor White
    Write-Host "- 数据库连接问题" -ForegroundColor White
}

Write-Host "`n3. 测试PUT方法..." -ForegroundColor Yellow

# 准备PUT请求数据
$putData = @{
    type = "task"
    title = "PUT方法测试 - 更新Issue标题"
    description = "这是通过PUT方法更新的Issue描述内容"
    state = "in_progress"
    priority = "high"
    severity = "medium"
    assigneeId = $null
    reporterId = $null
    storyPoints = 8
    estimatedHours = 12.5
    actualHours = 3.0
    labels = @("test", "api", "put")
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
    Write-Host "故事点数: $($putResponse.storyPoints)" -ForegroundColor White
} catch {
    Write-Host "❌ PUT请求失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n4. 测试PATCH方法（对比）..." -ForegroundColor Yellow
$patchData = @{
    title = "PATCH方法测试 - 部分更新"
    state = "done"
    priority = "low"
} | ConvertTo-Json

try {
    $patchResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId" -Method PATCH -Body $patchData -ContentType "application/json"
    Write-Host "✅ PATCH请求成功!" -ForegroundColor Green
    Write-Host "PATCH更新后的标题: $($patchResponse.title)" -ForegroundColor White
    Write-Host "PATCH更新后的状态: $($patchResponse.state)" -ForegroundColor White
} catch {
    Write-Host "❌ PATCH请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. API端点总结:" -ForegroundColor Yellow
Write-Host "GET    /projects/:projectId/issues/:id     - 获取Issue详情" -ForegroundColor White
Write-Host "POST   /projects/:projectId/issues         - 创建新Issue" -ForegroundColor White
Write-Host "PUT    /projects/:projectId/issues/:id     - 完整更新Issue（新增）" -ForegroundColor Green
Write-Host "PATCH  /projects/:projectId/issues/:id     - 部分更新Issue" -ForegroundColor White
Write-Host "DELETE /projects/:projectId/issues/:id     - 删除Issue" -ForegroundColor White

Write-Host "`n6. PUT vs PATCH 区别:" -ForegroundColor Yellow
Write-Host "PUT方法:" -ForegroundColor White
Write-Host "  - 需要提供所有必需字段" -ForegroundColor Gray
Write-Host "  - 用于完整替换资源" -ForegroundColor Gray
Write-Host "  - 支持所有Issue字段更新" -ForegroundColor Gray
Write-Host "PATCH方法:" -ForegroundColor White
Write-Host "  - 只需要提供要更新的字段" -ForegroundColor Gray
Write-Host "  - 用于部分更新资源" -ForegroundColor Gray
Write-Host "  - 只支持部分字段更新" -ForegroundColor Gray

Write-Host "`n7. 注意事项:" -ForegroundColor Yellow
Write-Host "- 确保提供有效的JWT认证令牌" -ForegroundColor White
Write-Host "- 检查用户权限（member或project_manager）" -ForegroundColor White
Write-Host "- PUT方法需要提供type、title、state等必需字段" -ForegroundColor White
Write-Host "- 日期格式使用ISO 8601标准" -ForegroundColor White
Write-Host "- 工时字段支持最多1位小数" -ForegroundColor White
