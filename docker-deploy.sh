#!/bin/bash
# 一键 Docker 部署脚本 for Ubuntu
# 远端主机地址: 101.126.6.243

set -e

# 项目名称
echo "🚀 Docker 部署 toGO 工程..."
PROJECT_NAME=togo

# 构建后端镜像
cd backend
if [ -f Dockerfile ]; then
  echo "🔨 构建后端 Docker 镜像..."
  docker build -t ${PROJECT_NAME}-backend:latest .
else
  echo "❌ backend/Dockerfile 不存在，无法构建后端镜像"
  exit 1
fi
cd ..

# 构建前端镜像
cd frontend
if [ -f Dockerfile ]; then
  echo "🔨 构建前端 Docker 镜像..."
  docker build -t ${PROJECT_NAME}-frontend:latest .
else
  echo "❌ frontend/Dockerfile 不存在，无法构建前端镜像"
  exit 1
fi
cd ..

# 启动服务（如有 docker-compose.yml 可用 compose，否则单独启动）
if [ -f docker-compose.yml ]; then
  echo "📦 使用 docker-compose 启动所有服务..."
  docker-compose up -d
else
  echo "📦 单独启动后端和前端容器..."
  docker run -d --name ${PROJECT_NAME}-backend -p 8080:8080 ${PROJECT_NAME}-backend:latest
  docker run -d --name ${PROJECT_NAME}-frontend -p 80:80 ${PROJECT_NAME}-frontend:latest
fi
echo "📦 使用 docker-compose 构建并启动所有服务..."
docker-compose build
docker-compose up -d

echo "✅ Docker 部署完成！"
echo "访问地址: http://101.126.6.243"
