#!/bin/bash
set -e

# 数据库恢复脚本
# 用法: ./scripts/restore.sh backup_name

if [ $# -eq 0 ]; then
    echo "用法: $0 <backup_name>"
    echo "可用的备份文件:"
    ls -la ./backups/*_full.tar.gz 2>/dev/null | awk '{print $9}' | sed 's/.*\///' | sed 's/_full\.tar\.gz$//' || echo "  无备份文件"
    exit 1
fi

BACKUP_NAME=$1
BACKUP_DIR="./backups"
MYSQL_CONTAINER="project-manager-mysql-1"
MINIO_CONTAINER="project-manager-minio-1"

BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}_full.tar.gz"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "警告: 此操作将覆盖当前数据库和文件存储！"
echo "备份文件: $BACKUP_FILE"
read -p "确认继续? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

echo "开始恢复: $BACKUP_NAME"

# 1. 解压备份文件
echo "解压备份文件..."
cd "$BACKUP_DIR"
tar xzf "${BACKUP_NAME}_full.tar.gz"
cd ..

# 2. 停止应用服务（保留数据库服务）
echo "停止应用服务..."
docker compose stop server web || true

# 3. 恢复 MySQL 数据库
echo "恢复 MySQL 数据库..."
docker exec -i "$MYSQL_CONTAINER" mysql -u root -p"${MYSQL_ROOT_PASSWORD:-pm123456}" project_manager < "$BACKUP_DIR/${BACKUP_NAME}_mysql.sql"

# 4. 恢复 MinIO 数据
echo "恢复 MinIO 数据..."
docker run --rm \
  -v project-manager_minio-data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar xzf "/backup/${BACKUP_NAME}_minio.tar.gz" -C /data

# 5. 恢复 Redis 数据（如果存在）
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" ]; then
    echo "恢复 Redis 数据..."
    docker cp "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" "$MYSQL_CONTAINER:/data/dump.rdb" 2>/dev/null || echo "Redis 恢复跳过"
fi

# 6. 清理临时文件
echo "清理临时文件..."
rm -rf "$BACKUP_DIR/${BACKUP_NAME}_mysql.sql" "$BACKUP_DIR/${BACKUP_NAME}_minio.tar.gz" "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" "$BACKUP_DIR/${BACKUP_NAME}_info.txt"

# 7. 重启应用服务
echo "重启应用服务..."
docker compose up -d

# 8. 等待服务就绪
echo "等待服务启动..."
sleep 10

# 9. 验证恢复
echo "验证恢复结果..."
if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ 恢复成功！服务正常运行"
else
    echo "❌ 恢复可能有问题，请检查日志"
    docker compose logs server
fi

echo "恢复任务完成！"
