## 可选：Prisma 目录

如果选择 Prisma，可将 `docs/项目管理工具/数据库/schema.prisma` 复制到 `server/prisma/schema.prisma`，并执行：
```bash
cd server
npm i prisma @prisma/client
npx prisma generate
npx prisma migrate dev
```

注意：与 TypeORM 二选一作为主 ORM，避免双写。迁移到 Prisma 时请禁用 TypeORM 的 `synchronize` 和实体自动加载。


