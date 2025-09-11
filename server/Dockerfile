# 后端 Dockerfile
FROM zhcoder-docker-registry.com:8000/dev-env/nodejs:v22 AS base

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM zhcoder-docker-registry.com:8000/dev-env/nodejs:v22 AS production

# 安装 mysql-client 用于健康检查
RUN apk add --no-cache mysql-client

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=base /app/dist ./dist
COPY --from=base /app/src/migrations ./src/migrations
COPY --from=base /app/src/typeorm-data-source.ts ./src/typeorm-data-source.ts

# 复制迁移脚本
COPY scripts/migrate.sh ./scripts/migrate.sh
RUN chmod +x ./scripts/migrate.sh

# 暴露端口
EXPOSE 3000

# 启动命令：先迁移再启动
CMD ["sh", "-c", "./scripts/migrate.sh && npm start"]
