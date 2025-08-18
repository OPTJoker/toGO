#!/bin/bash

# toGO 修复版部署脚本

set -e

echo "🚀 开始部署 toGO 工具网站..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置Docker镜像加速
configure_docker() {
    echo "🐳 配置Docker镜像加速..."
    
    sudo mkdir -p /etc/docker
    
    sudo tee /etc/docker/daemon.json <<-'DOCKEREOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://dockerproxy.com"
  ],
  "max-concurrent-downloads": 10,
  "log-driver": "json-file",
  "log-level": "warn",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DOCKEREOF

    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    echo -e "${GREEN}✅ Docker镜像加速配置完成${NC}"
}

# 预拉取镜像
pull_images() {
    echo "📦 预拉取镜像..."
    
    # 使用官方镜像，通过镜像加速器下载
    docker pull golang:1.21-alpine || echo "跳过golang镜像"
    docker pull alpine:latest || echo "跳过alpine镜像"
    docker pull node:18-alpine || echo "跳过node镜像"
    docker pull nginx:alpine || echo "跳过nginx镜像"
    
    echo -e "${GREEN}✅ 镜像拉取尝试完成${NC}"
}

# 部署应用
deploy_app() {
    echo "🚀 部署应用..."
    
    # 停止旧容器
    docker-compose down 2>/dev/null || true
    
    # 清理旧镜像
    docker system prune -f
    
    # 构建并启动（增加超时时间）
    export DOCKER_CLIENT_TIMEOUT=600
    export COMPOSE_HTTP_TIMEOUT=600
    docker-compose up --build -d
    
    echo -e "${GREEN}✅ 应用部署完成${NC}"
}

# 健康检查
health_check() {
    echo "🔍 健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查容器状态
    docker-compose ps
    
    # 检查后端健康
    echo "检查后端服务..."
    for i in {1..5}; do
        if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端服务正常${NC}"
            break
        else
            echo "等待后端服务启动... ($i/5)"
            sleep 10
        fi
    done
    
    # 检查前端
    echo "检查前端服务..."
    if curl -f http://localhost >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️ 前端可能需要更多时间启动${NC}"
    fi
    
    # 显示日志
    echo "最近的容器日志："
    docker-compose logs --tail=20
}

# 主函数
main() {
    configure_docker
    sleep 5  # 等待Docker重启完成
    pull_images
    deploy_app
    health_check
    
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "访问地址: http://101.126.6.243"
    echo "如果无法访问，请检查云服务器安全组设置"
}

main "$@"
