# 测试GitLab Issue创建功能
# 这个脚本用于测试当本地Issue在GitLab中不存在时，系统是否能正确创建新的GitLab Issue

Write-Host "=== 测试GitLab Issue创建功能 ===" -ForegroundColor Green

# 设置测试参数
$baseUrl = "http://localhost:3000"
$testProjectId = "your-project-id"  # 请替换为实际的测试项目ID

Write-Host "1. 创建本地Issue（没有GitLab IID）..." -ForegroundColor Yellow

# 创建本地Issue（模拟没有GitLab IID的情况）
$createIssueData = @{
    projectId = $testProjectId
    title = "测试Issue - 应该自动创建到GitLab"
    description = "这是一个测试Issue，用于验证自动创建到GitLab的功能"
    type = "task"
    state = "open"
    priority = "medium"
    severity = "low"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/issues" -Method POST -Body $createIssueData -ContentType "application/json"
    $issueId = $response.id
    $issueKey = $response.key
    
    Write-Host "✓ 本地Issue创建成功" -ForegroundColor Green
    Write-Host "  Issue ID: $issueId" -ForegroundColor Cyan
    Write-Host "  Issue Key: $issueKey" -ForegroundColor Cyan
    
    # 等待一下让系统处理
    Start-Sleep -Seconds 2
    
    Write-Host "`n2. 更新Issue以触发GitLab同步..." -ForegroundColor Yellow
    
    # 更新Issue以触发GitLab同步
    $updateData = @{
        title = "测试Issue - 已更新标题"
        description = "更新后的描述，应该同步到GitLab"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/issues/$issueId" -Method PUT -Body $updateData -ContentType "application/json"
    
    Write-Host "✓ Issue更新成功" -ForegroundColor Green
    Write-Host "  更新后的Key: $($updateResponse.key)" -ForegroundColor Cyan
    
    # 检查Key是否包含GitLab IID
    if ($updateResponse.key -match "-\d+$") {
        Write-Host "✓ Issue Key包含GitLab IID，说明已成功创建到GitLab" -ForegroundColor Green
    } else {
        Write-Host "⚠ Issue Key不包含GitLab IID，可能创建失败" -ForegroundColor Yellow
    }
    
    Write-Host "`n3. 验证GitLab中的Issue..." -ForegroundColor Yellow
    Write-Host "请手动检查GitLab项目中是否出现了新的Issue" -ForegroundColor Cyan
    Write-Host "预期行为：" -ForegroundColor Cyan
    Write-Host "  - GitLab中应该有一个新的Issue" -ForegroundColor White
    Write-Host "  - Issue标题应该是：'测试Issue - 已更新标题'" -ForegroundColor White
    Write-Host "  - Issue描述应该包含更新后的内容" -ForegroundColor White
    
} catch {
    Write-Host "✗ 测试失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查：" -ForegroundColor Yellow
    Write-Host "  1. 服务器是否正在运行" -ForegroundColor White
    Write-Host "  2. 项目ID是否正确" -ForegroundColor White
    Write-Host "  3. GitLab集成是否配置正确" -ForegroundColor White
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green
