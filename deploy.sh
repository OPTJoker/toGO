#!/bin/bash

# toGO 中国区优化部署脚本

set -e

echo "🚀 开始部署 toGO 工具网站（中国区优化）..."

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
    "https://mirror.baidubce.com"
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
    
    docker pull registry.cn-hangzhou.aliyuncs.com/acs/golang:1.21-alpine
    docker pull registry.cn-hangzhou.aliyuncs.com/acs/alpine:latest
    docker pull registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine
    docker pull registry.cn-hangzhou.aliyuncs.com/acs/nginx:alpine
    
    echo -e "${GREEN}✅ 镜像拉取完成${NC}"
}

# 部署应用
deploy_app() {
    echo "🚀 部署应用..."
    
    # 停止旧容器
    docker-compose down 2>/dev/null || true
    
    # 清理旧镜像
    docker system prune -f
    
    # 构建并启动（增加超时时间）
    DOCKER_CLIENT_TIMEOUT=300 COMPOSE_HTTP_TIMEOUT=300 docker-compose up --build -d
    
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
    if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务正常${NC}"
    else
        echo -e "${RED}❌ 后端服务异常${NC}"
        docker-compose logs backend
    fi
    
    # 检查前端
    if curl -f http://localhost >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务正常${NC}"
    else
        echo -e "${RED}❌ 前端服务异常${NC}"
        docker-compose logs frontend
    fi
}

# 主函数
main() {
    configure_docker
    pull_images
    deploy_app
    health_check
    
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "访问地址: http://$(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
}

main "$@"