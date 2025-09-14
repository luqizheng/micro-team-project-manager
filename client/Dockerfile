# 前端 Dockerfile
FROM zhcoder-docker-registry.com:8000/dev-env/nodejs:v22 AS base

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 使用 nginx 提供静态文件
FROM zhcoder-docker-registry.com:8000/official/nginx:1.25-alpine AS production

# 复制构建产物到 nginx 目录
COPY --from=base /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
