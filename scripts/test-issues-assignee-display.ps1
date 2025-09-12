# 测试Issues列表负责人显示功能
Write-Host "测试Issues列表负责人显示功能..." -ForegroundColor Green

# 设置变量
$baseUrl = "http://localhost:3000"
$projectId = "0b122ef1-f073-4520-b5d6-e1e26ea05c56"

Write-Host "`n1. 检查后端服务状态..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行，请先启动服务" -ForegroundColor Red
    Write-Host "启动命令: cd server && npm run start:dev" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n2. 测试Issues列表API..." -ForegroundColor Yellow
try {
    $issuesResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues" -Method GET
    Write-Host "✅ Issues列表获取成功" -ForegroundColor Green
    Write-Host "总数量: $($issuesResponse.total)" -ForegroundColor White
    
    if ($issuesResponse.items -and $issuesResponse.items.Count -gt 0) {
        Write-Host "`n前3个Issue的负责人信息:" -ForegroundColor Cyan
        for ($i = 0; $i -lt [Math]::Min(3, $issuesResponse.items.Count); $i++) {
            $issue = $issuesResponse.items[$i]
            Write-Host "Issue $($i + 1):" -ForegroundColor White
            Write-Host "  标题: $($issue.title)" -ForegroundColor Gray
            Write-Host "  负责人ID: $($issue.assigneeId)" -ForegroundColor Gray
            Write-Host "  负责人姓名: $($issue.assigneeName)" -ForegroundColor Green
            Write-Host "  负责人邮箱: $($issue.assigneeEmail)" -ForegroundColor Gray
            Write-Host "  报告人姓名: $($issue.reporterName)" -ForegroundColor Blue
            Write-Host "  报告人邮箱: $($issue.reporterEmail)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "⚠️ 没有找到Issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Issues列表获取失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n3. 测试带筛选的Issues查询..." -ForegroundColor Yellow
try {
    $filteredResponse = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues?page=1&pageSize=5" -Method GET
    Write-Host "✅ 筛选查询成功" -ForegroundColor Green
    Write-Host "返回数量: $($filteredResponse.items.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ 筛选查询失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. 检查数据结构..." -ForegroundColor Yellow
Write-Host "期望的字段:" -ForegroundColor White
Write-Host "- assigneeId: 负责人ID" -ForegroundColor Gray
Write-Host "- assigneeName: 负责人姓名 (新增)" -ForegroundColor Green
Write-Host "- assigneeEmail: 负责人邮箱 (新增)" -ForegroundColor Green
Write-Host "- reporterId: 报告人ID" -ForegroundColor Gray
Write-Host "- reporterName: 报告人姓名 (新增)" -ForegroundColor Blue
Write-Host "- reporterEmail: 报告人邮箱 (新增)" -ForegroundColor Blue

Write-Host "`n5. 前端显示修改说明:" -ForegroundColor Yellow
Write-Host "Issues.vue中的修改:" -ForegroundColor White
Write-Host "- 将 record.assigneeId 改为 record.assigneeName" -ForegroundColor Green
Write-Host "- 现在显示用户姓名而不是ID" -ForegroundColor Green
Write-Host "- 如果assigneeName为空，显示'未分配'" -ForegroundColor Green

Write-Host "`n6. 验证步骤:" -ForegroundColor Yellow
Write-Host "1. 确保后端服务正在运行" -ForegroundColor White
Write-Host "2. 检查数据库中有用户数据" -ForegroundColor White
Write-Host "3. 检查Issues表中有assigneeId数据" -ForegroundColor White
Write-Host "4. 验证API返回包含assigneeName字段" -ForegroundColor White
Write-Host "5. 前端页面应该显示用户姓名" -ForegroundColor White

Write-Host "`n7. 故障排除:" -ForegroundColor Yellow
Write-Host "如果assigneeName为空:" -ForegroundColor White
Write-Host "- 检查users表是否有对应的用户数据" -ForegroundColor Gray
Write-Host "- 检查issues表中的assigneeId是否正确" -ForegroundColor Gray
Write-Host "- 检查LEFT JOIN查询是否正确" -ForegroundColor Gray
Write-Host "- 检查数据库连接是否正常" -ForegroundColor Gray
