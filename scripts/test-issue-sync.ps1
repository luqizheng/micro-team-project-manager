# 测试 Issue 同步到 GitLab 功能
# 使用方法: .\scripts\test-issue-sync.ps1

Write-Host "测试 Issue 同步到 GitLab 功能" -ForegroundColor Green

# 配置
$baseUrl = "http://localhost:3000"
$projectId = "your-project-id"  # 替换为实际的项目ID
$issueId = "your-issue-id"      # 替换为实际的 Issue ID

# 测试同步接口
Write-Host "`n1. 测试同步接口..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/issues/$issueId/sync-to-gitlab" -Method POST -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer your-jwt-token"  # 替换为实际的 JWT token
    }
    
    Write-Host "同步结果:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "同步失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "响应内容: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n测试完成！" -ForegroundColor Green
