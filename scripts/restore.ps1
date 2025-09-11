# 数据库恢复脚本 (PowerShell)
# 用法: .\scripts\restore.ps1 backup_name

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupName
)

$BackupDir = ".\backups"
$MysqlContainer = "project-manager-mysql-1"
$MinioContainer = "project-manager-minio-1"
$BackupFile = "$BackupDir\${BackupName}_full.zip"

if (!(Test-Path $BackupFile)) {
    Write-Host "错误: 备份文件不存在: $BackupFile" -ForegroundColor Red
    Write-Host "可用的备份文件:" -ForegroundColor Yellow
    Get-ChildItem "$BackupDir\backup_*_full.zip" | ForEach-Object { $_.Name -replace '_full\.zip$', '' }
    exit 1
}

Write-Host "警告: 此操作将覆盖当前数据库和文件存储！" -ForegroundColor Red
Write-Host "备份文件: $BackupFile" -ForegroundColor Yellow
$Confirm = Read-Host "确认继续? (y/N)"
if ($Confirm -notmatch '^[Yy]$') {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host "开始恢复: $BackupName" -ForegroundColor Green

# 1. 解压备份文件
Write-Host "解压备份文件..." -ForegroundColor Yellow
Push-Location $BackupDir
try {
    Expand-Archive -Path "${BackupName}_full.zip" -DestinationPath "." -Force
} finally {
    Pop-Location
}

# 2. 停止应用服务（保留数据库服务）
Write-Host "停止应用服务..." -ForegroundColor Yellow
docker compose stop server web

# 3. 恢复 MySQL 数据库
Write-Host "恢复 MySQL 数据库..." -ForegroundColor Yellow
$env:MYSQL_ROOT_PASSWORD = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "pm123456" }
Get-Content "$BackupDir\${BackupName}_mysql.sql" | docker exec -i $MysqlContainer mysql -u root -p"$env:MYSQL_ROOT_PASSWORD" project_manager

# 4. 恢复 MinIO 数据
Write-Host "恢复 MinIO 数据..." -ForegroundColor Yellow
docker run --rm -v project-manager_minio-data:/data -v "${PWD}\$BackupDir":/backup alpine tar xzf "/backup/${BackupName}_minio.tar.gz" -C /data

# 5. 恢复 Redis 数据（如果存在）
if (Test-Path "$BackupDir\${BackupName}_redis.rdb") {
    Write-Host "恢复 Redis 数据..." -ForegroundColor Yellow
    try {
        docker cp "$BackupDir\${BackupName}_redis.rdb" "${MysqlContainer}:/data/dump.rdb"
    } catch {
        Write-Host "Redis 恢复跳过" -ForegroundColor Yellow
    }
}

# 6. 清理临时文件
Write-Host "清理临时文件..." -ForegroundColor Yellow
Remove-Item "$BackupDir\${BackupName}_mysql.sql", "$BackupDir\${BackupName}_minio.tar.gz", "$BackupDir\${BackupName}_redis.rdb", "$BackupDir\${BackupName}_info.txt" -ErrorAction SilentlyContinue

# 7. 重启应用服务
Write-Host "重启应用服务..." -ForegroundColor Yellow
docker compose up -d

# 8. 等待服务就绪
Write-Host "等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 9. 验证恢复
Write-Host "验证恢复结果..." -ForegroundColor Yellow
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -UseBasicParsing
    if ($Response.StatusCode -eq 200) {
        Write-Host "✅ 恢复成功！服务正常运行" -ForegroundColor Green
    } else {
        Write-Host "❌ 恢复可能有问题，请检查日志" -ForegroundColor Red
        docker compose logs server
    }
} catch {
    Write-Host "❌ 恢复可能有问题，请检查日志" -ForegroundColor Red
    docker compose logs server
}

Write-Host "恢复任务完成！" -ForegroundColor Green
