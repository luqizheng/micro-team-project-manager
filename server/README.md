## Server (NestJS)

### 开发启动
1. 在项目根目录已运行 `docker compose up -d` 启动 MySQL/Redis/MinIO。
2. 复制 `.env.example` 为 `.env`（在仓库根目录），确保 `DATABASE_URL` 指向本地 MySQL。
3. 安装依赖并启动：
```bash
cd server
npm i
npx nest --version || npx -y @nestjs/cli --version
npm run start:dev
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
```


