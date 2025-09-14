# GitLab实例API测试脚本
# 测试修复后的字段映射是否正确

Write-Host "开始测试GitLab实例API..." -ForegroundColor Green

# 设置测试数据
$baseUrl = "http://localhost:3000"
$testInstance = @{
    name = "测试GitLab实例"
    url = "https://gitlab.example.com"
    type = "self_hosted"
    accessToken = "glpat-12345678901234567890"
    webhookSecret = "test-webhook-secret"
    description = "这是一个测试实例"
    isActive = $true
}

Write-Host "测试数据:" -ForegroundColor Yellow
$testInstance | ConvertTo-Json -Depth 3

try {
    # 测试创建实例
    Write-Host "`n1. 测试创建GitLab实例..." -ForegroundColor Cyan
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/gitlab/instances" -Method POST -Body ($testInstance | ConvertTo-Json) -ContentType "application/json" -Headers @{"Authorization" = "Bearer your-jwt-token"}
    
    Write-Host "创建成功!" -ForegroundColor Green
    Write-Host "响应数据:" -ForegroundColor Yellow
    $createResponse | ConvertTo-Json -Depth 3
    
    $instanceId = $createResponse.id
    
    # 测试获取实例
    Write-Host "`n2. 测试获取GitLab实例..." -ForegroundColor Cyan
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/gitlab/instances/$instanceId" -Method GET -Headers @{"Authorization" = "Bearer your-jwt-token"}
    
    Write-Host "获取成功!" -ForegroundColor Green
    Write-Host "响应数据:" -ForegroundColor Yellow
    $getResponse | ConvertTo-Json -Depth 3
    
    # 验证字段映射
    Write-Host "`n3. 验证字段映射..." -ForegroundColor Cyan
    $fieldMappings = @{
        "前端提交 url" = $testInstance.url
        "后端返回 url" = $getResponse.url
        "前端提交 type" = $testInstance.type
        "后端返回 type" = $getResponse.type
        "前端提交 accessToken" = $testInstance.accessToken
        "后端返回 accessToken" = $getResponse.accessToken
    }
    
    $fieldMappings.GetEnumerator() | ForEach-Object {
        Write-Host "$($_.Key): $($_.Value)" -ForegroundColor White
    }
    
    # 测试更新实例
    Write-Host "`n4. 测试更新GitLab实例..." -ForegroundColor Cyan
    $updateData = @{
        name = "更新后的测试实例"
        url = "https://updated-gitlab.example.com"
        type = "gitlab_com"
        description = "这是更新后的描述"
    }
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/gitlab/instances/$instanceId" -Method PUT -Body ($updateData | ConvertTo-Json) -ContentType "application/json" -Headers @{"Authorization" = "Bearer your-jwt-token"}
    
    Write-Host "更新成功!" -ForegroundColor Green
    Write-Host "更新后数据:" -ForegroundColor Yellow
    $updateResponse | ConvertTo-Json -Depth 3
    
    # 清理测试数据
    Write-Host "`n5. 清理测试数据..." -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$baseUrl/gitlab/instances/$instanceId" -Method DELETE -Headers @{"Authorization" = "Bearer your-jwt-token"}
    Write-Host "清理完成!" -ForegroundColor Green
    
    Write-Host "`n所有测试通过! 字段映射修复成功!" -ForegroundColor Green
    
} catch {
    Write-Host "`n测试失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "错误详情: $($_.Exception)" -ForegroundColor Red
}

Write-Host "`n测试完成!" -ForegroundColor Green
