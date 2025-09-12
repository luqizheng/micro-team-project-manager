#!/bin/bash

# 安装Markdown编辑器相关依赖
echo "安装Markdown编辑器依赖..."

cd client
npm install dompurify@^3.0.8 marked@^12.0.0

echo "依赖安装完成！"
echo ""
echo "请运行以下命令启动开发服务器："
echo "npm run dev"
