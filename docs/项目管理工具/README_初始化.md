## 初始化与本地启动指南

### 1. 前置条件
- 安装 Docker 与 Docker Compose（v2+）。
- 复制 `.env.example` 为 `.env`，如需修改端口与密码可自行调整。

### 2. 启动基础设施
```bash
docker compose up -d
```
- 组件与端口：
  - MySQL 8: 3306（数据库：`project_manager`，默认用户/密码：`pm/pm123456`）
  - Redis 7: 6379
  - MinIO: 9000（S3 API）/ 9001（控制台，账号/密码：`minioadmin/minioadmin`）

### 3. 数据库连接字符串
- Prisma / TypeORM 使用 `DATABASE_URL`：
```
mysql://pm:pm123456@localhost:3306/project_manager?connection_limit=10&pool_timeout=10&sslmode=disable
```

### 4. 创建 MinIO 存储桶（首次）
1) 访问控制台 `http://localhost:9001` 登录。
2) 新建 Bucket：`pm-attachments`，可选开启版本化。

### 5. 常见问题
- 端口被占用：修改 `docker-compose.yml` 中映射端口或关闭占用程序。
- MySQL 初始化失败：确认磁盘权限与 `MYSQL_ROOT_PASSWORD` 设置；重启容器。
- MinIO 健康检查失败：确认 9000/9001 端口未冲突；稍等 10-20 秒后重试。

### 6. 后续步骤
- 根据选择的 ORM 执行迁移：
  - Prisma：`npx prisma migrate dev`（需先有初始应用与 schema）
  - TypeORM：生成并运行 migration，或使用 `synchronize`（仅开发）
- 启动后端与前端服务并验证 API 与对象存储读写。

### 7. 使用脚本快捷启动/停止（推荐）
- 复制 `.env.example` 为 `.env`（或 `docker/.env`），填入上面各变量。
- 启动：
```bash
./scripts/start.sh .env
# 或 PowerShell
./scripts/start.ps1 -EnvFile .env
```
- 停止：
```bash
./scripts/stop.sh .env
# 或 PowerShell
./scripts/stop.ps1 -EnvFile .env
```


