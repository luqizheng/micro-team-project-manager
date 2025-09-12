# 测试修改密码功能
Write-Host "测试修改密码功能..." -ForegroundColor Green

# 设置基础URL
$baseUrl = "http://localhost:3000"

# 首先登录获取token
Write-Host "1. 登录获取token..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "登录成功，token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 设置请求头
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 获取用户列表
Write-Host "2. 获取用户列表..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers
    $users = $usersResponse.data.items
    Write-Host "找到 $($users.Count) 个用户" -ForegroundColor Green
    
    if ($users.Count -eq 0) {
        Write-Host "没有用户，无法测试修改密码功能" -ForegroundColor Red
        exit 1
    }
    
    $testUser = $users[0]
    Write-Host "选择测试用户: $($testUser.name) ($($testUser.email))" -ForegroundColor Green
} catch {
    Write-Host "获取用户列表失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试修改密码
Write-Host "3. 测试修改密码..." -ForegroundColor Yellow
$passwordData = @{
    password = "newpassword123"
} | ConvertTo-Json

try {
    $passwordResponse = Invoke-RestMethod -Uri "$baseUrl/users/$($testUser.id)/password" -Method Patch -Body $passwordData -Headers $headers
    Write-Host "密码修改成功: $($passwordResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "密码修改失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "修改密码功能测试完成!" -ForegroundColor Green