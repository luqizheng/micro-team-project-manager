# 启动带SQL调试的后端服务
Write-Host "启动带SQL调试的后端服务..." -ForegroundColor Green

# 设置环境变量
$env:NODE_ENV = "development"

# 检查环境文件
if (Test-Path "env") {
    Write-Host "✓ 找到环境配置文件" -ForegroundColor Green
} else {
    Write-Host "✗ 未找到环境配置文件，请确保env文件存在" -ForegroundColor Red
    exit 1
}

# 检查数据库连接
Write-Host "`n检查数据库连接..." -ForegroundColor Yellow
try {
    $envContent = Get-Content "env" -Raw
    if ($envContent -match "DATABASE_URL=(.+)") {
        $databaseUrl = $matches[1]
        Write-Host "✓ 数据库URL配置: $databaseUrl" -ForegroundColor Green
    } else {
        Write-Host "✗ 未找到DATABASE_URL配置" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 读取环境配置失败" -ForegroundColor Red
    exit 1
}

# 启动服务
Write-Host "`n启动后端服务..." -ForegroundColor Yellow
Write-Host "SQL调试已启用，将显示所有数据库查询" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Cyan
Write-Host ""

try {
    Set-Location server
    npm run start:dev
} catch {
    Write-Host "`n启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "1. 数据库服务是否运行" -ForegroundColor White
    Write-Host "2. 环境配置是否正确" -ForegroundColor White
    Write-Host "3. 依赖包是否安装完整" -ForegroundColor White
} finally {
    Set-Location ..
}
