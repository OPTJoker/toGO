#!/bin/bash
# 远端部署脚本 for Ubuntu 101.126.6.243
# 使用主机MySQL数据库

set -e

# 项目配置
PROJECT_NAME=togo
REMOTE_HOST=101.126.6.243
MYSQL_DB_NAME=togo_stats

echo "🚀 开始部署 toGO 到远端主机 ${REMOTE_HOST}..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查MySQL是否运行
echo "🔍 检查MySQL服务状态..."
if ! systemctl is-active --quiet mysql; then
    echo "❌ MySQL 服务未运行，请启动MySQL服务"
    echo "运行: sudo systemctl start mysql"
    exit 1
fi

# 创建数据库（如果不存在）
echo "📊 创建数据库..."
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
    echo "❌ 数据库创建失败，请检查MySQL连接"
    exit 1
}

# 停止并删除现有容器
echo "🛑 停止现有服务..."
docker-compose down || true

# 清理旧镜像（可选）
echo "🧹 清理旧镜像..."
docker image prune -f || true

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose build --no-cache
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查后端健康状态
echo "🏥 检查后端健康状态..."
for i in {1..30}; do
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 后端服务启动失败"
        docker-compose logs backend
        exit 1
    fi
    echo "等待后端服务启动... ($i/30)"
    sleep 2
done

# 检查前端服务
echo "🌐 检查前端服务..."
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ 前端服务启动成功"
else
    echo "❌ 前端服务可能有问题"
    docker-compose logs frontend
fi

echo ""
echo "🎉 部署完成！"
echo "📍 访问地址: http://${REMOTE_HOST}"
echo "📊 后端API: http://${REMOTE_HOST}/api"
echo "🏥 健康检查: http://${REMOTE_HOST}/api/health"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "  查看状态: docker-compose ps"