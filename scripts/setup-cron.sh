#!/bin/bash
# 设置定时备份任务
# 用法: ./scripts/setup-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

# 创建 crontab 任务
CRON_JOB="0 2 * * * cd $PROJECT_DIR && $BACKUP_SCRIPT >> logs/backup.log 2>&1"

# 检查是否已存在备份任务
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    echo "定时备份任务已存在"
    crontab -l | grep "backup.sh"
else
    # 添加新的定时任务
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "定时备份任务已添加: 每天凌晨2点执行"
fi

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

echo "定时备份设置完成！"
echo "当前 crontab 任务:"
crontab -l
