# 数据库备份脚本 (PowerShell)
# 用法: .\scripts\backup.ps1 [backup_name]

param(
    [string]$BackupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
)

$BackupDir = ".\backups"
$MysqlContainer = "project-manager-mysql-1"
$MinioContainer = "project-manager-minio-1"

# 创建备份目录
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir
}

Write-Host "开始备份: $BackupName" -ForegroundColor Green

# 1. 备份 MySQL 数据库
Write-Host "备份 MySQL 数据库..." -ForegroundColor Yellow
$env:MYSQL_ROOT_PASSWORD = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "pm123456" }
docker exec $MysqlContainer mysqldump -u root -p"$env:MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers project_manager | Out-File -FilePath "$BackupDir\${BackupName}_mysql.sql" -Encoding UTF8

# 2. 备份 MinIO 数据
Write-Host "备份 MinIO 数据..." -ForegroundColor Yellow
docker run --rm -v project-manager_minio-data:/data -v "${PWD}\$BackupDir":/backup alpine tar czf "/backup/${BackupName}_minio.tar.gz" -C /data .

# 3. 备份 Redis 数据（可选）
Write-Host "备份 Redis 数据..." -ForegroundColor Yellow
docker exec $MysqlContainer redis-cli BGSAVE
try {
    docker cp "${MysqlContainer}:/data/dump.rdb" "$BackupDir\${BackupName}_redis.rdb"
} catch {
    Write-Host "Redis 备份跳过（无数据）" -ForegroundColor Yellow
}

# 4. 创建备份信息文件
$InfoContent = @"
备份时间: $(Get-Date)
备份名称: $BackupName
MySQL 版本: $(docker exec $MysqlContainer mysql --version)
MinIO 版本: $(docker exec $MinioContainer minio --version 2>$null)
备份文件:
- ${BackupName}_mysql.sql
- ${BackupName}_minio.tar.gz
- ${BackupName}_redis.rdb
- ${BackupName}_info.txt
"@
$InfoContent | Out-File -FilePath "$BackupDir\${BackupName}_info.txt" -Encoding UTF8

# 5. 压缩整个备份
Write-Host "压缩备份文件..." -ForegroundColor Yellow
Push-Location $BackupDir
try {
    Compress-Archive -Path "${BackupName}_*" -DestinationPath "${BackupName}_full.zip" -Force
    Remove-Item "${BackupName}_mysql.sql", "${BackupName}_minio.tar.gz", "${BackupName}_redis.rdb", "${BackupName}_info.txt" -ErrorAction SilentlyContinue
} finally {
    Pop-Location
}

# 6. 清理旧备份（保留最近7天）
Write-Host "清理旧备份..." -ForegroundColor Yellow
Get-ChildItem "$BackupDir\backup_*_full.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item

Write-Host "备份完成: $BackupDir\${BackupName}_full.zip" -ForegroundColor Green
Write-Host "备份任务完成！" -ForegroundColor Green
