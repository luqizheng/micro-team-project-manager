#!/bin/bash
set -e

# 数据库备份脚本
# 用法: ./scripts/backup.sh [backup_name]

BACKUP_NAME=${1:-"backup_$(date +%Y%m%d_%H%M%S)"}
BACKUP_DIR="./backups"
MYSQL_CONTAINER="project-manager-mysql-1"
MINIO_CONTAINER="project-manager-minio-1"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "开始备份: $BACKUP_NAME"

# 1. 备份 MySQL 数据库
echo "备份 MySQL 数据库..."
docker exec "$MYSQL_CONTAINER" mysqldump \
  -u root \
  -p"${MYSQL_ROOT_PASSWORD:-pm123456}" \
  --single-transaction \
  --routines \
  --triggers \
  project_manager > "$BACKUP_DIR/${BACKUP_NAME}_mysql.sql"

# 2. 备份 MinIO 数据
echo "备份 MinIO 数据..."
docker run --rm \
  -v project-manager_minio-data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar czf "/backup/${BACKUP_NAME}_minio.tar.gz" -C /data .

# 3. 备份 Redis 数据（可选）
echo "备份 Redis 数据..."
docker exec "$MYSQL_CONTAINER" redis-cli BGSAVE
docker cp "$MYSQL_CONTAINER:/data/dump.rdb" "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" 2>/dev/null || echo "Redis 备份跳过（无数据）"

# 4. 创建备份信息文件
cat > "$BACKUP_DIR/${BACKUP_NAME}_info.txt" << EOF
备份时间: $(date)
备份名称: $BACKUP_NAME
MySQL 版本: $(docker exec "$MYSQL_CONTAINER" mysql --version)
MinIO 版本: $(docker exec "$MINIO_CONTAINER" minio --version 2>/dev/null || echo "未知")
备份文件:
- ${BACKUP_NAME}_mysql.sql
- ${BACKUP_NAME}_minio.tar.gz
- ${BACKUP_NAME}_redis.rdb
- ${BACKUP_NAME}_info.txt
EOF

# 5. 压缩整个备份
echo "压缩备份文件..."
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}_full.tar.gz" "${BACKUP_NAME}"*
rm -rf "${BACKUP_NAME}_mysql.sql" "${BACKUP_NAME}_minio.tar.gz" "${BACKUP_NAME}_redis.rdb" "${BACKUP_NAME}_info.txt"
cd ..

echo "备份完成: $BACKUP_DIR/${BACKUP_NAME}_full.tar.gz"

# 6. 清理旧备份（保留最近7天）
echo "清理旧备份..."
find "$BACKUP_DIR" -name "backup_*_full.tar.gz" -mtime +7 -delete

echo "备份任务完成！"
