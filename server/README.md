## Server (NestJS)

### 开发启动

1. 在项目根目录已运行 `docker compose up -d` 启动 MySQL/Redis/MinIO。
2. 在 `server` 目录创建 `.env` 文件（或导出环境变量），至少包含：

```env
# HTTP
PORT=3000

# Database (示例)
# mysql://pm:pm123456@localhost:3306/project_manager
DATABASE_URL=mysql://pm:pm123456@localhost:3306/project_manager

# JWT
JWT_SECRET=dev-secret
ADMIN_EMAILS=
# 可选：管理员默认密码，不配置则为 admin123456
ADMIN_DEFAULT_PASSWORD=

# S3 兼容对象存储（如 MinIO）
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pm-bucket
S3_REGION=us-east-1
S3_USE_SSL=false
```

3. 安装依赖并启动：

```bash
cd server
npm i
npx nest --version || npx -y @nestjs/cli --version
npm run start:dev
```

### 切换环境文件（示例）

- 开发环境：

```bash
cd server
npm run env:dev   # 复制 .env.development.example 为 .env
```

- 生产环境（本地仅示例）：

```bash
cd server
npm run env:prod  # 复制 .env.production.example 为 .env
```

### 主要端点

- 健康检查：`GET /api/v1/health`
- 项目：`/api/v1/projects`（示例 CRUD）

### TypeORM 配置

- 通过环境变量 `DATABASE_URL`（形如 `mysql://pm:pm123456@localhost:3306/project_manager`）。
- 默认 `synchronize: false`，请使用 migration（后续可补充）。

### 迁移

```bash
cd server
npm run build
npm run migration:run
# 回滚：
# npm run migration:revert

# 生成新的迁移文件
# npm run migration:generate  --name=NewName
```
