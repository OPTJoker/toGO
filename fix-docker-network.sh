#!/bin/bash
# Docker网络问题修复脚本
# 解决Docker Hub访问超时问题

set -e

echo "🔧 修复Docker网络问题..."

# 1. 配置Docker镜像加速器
echo "📡 配置Docker镜像加速器..."

# 创建或修改Docker daemon配置
sudo mkdir -p /etc/docker

# 配置国内镜像加速器
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# 重启Docker服务
echo "🔄 重启Docker服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 等待Docker服务启动
sleep 5

# 验证Docker服务状态
if ! sudo systemctl is-active --quiet docker; then
    echo "❌ Docker服务启动失败"
    exit 1
fi

echo "✅ Docker镜像加速器配置完成"

# 2. 预拉取必要的镜像
echo "📦 预拉取必要的镜像..."

# 拉取Go构建镜像
echo "拉取golang:1.21-alpine..."
docker pull golang:1.21-alpine || {
    echo "⚠️  官方镜像拉取失败，尝试使用阿里云镜像..."
    docker pull registry.cn-hangzhou.aliyuncs.com/library/golang:1.21-alpine
    docker tag registry.cn-hangzhou.aliyuncs.com/library/golang:1.21-alpine golang:1.21-alpine
}

# 拉取Alpine基础镜像
echo "拉取alpine:latest..."
docker pull alpine:latest || {
    echo "⚠️  官方镜像拉取失败，尝试使用阿里云镜像..."
    docker pull registry.cn-hangzhou.aliyuncs.com/library/alpine:latest
    docker tag registry.cn-hangzhou.aliyuncs.com/library/alpine:latest alpine:latest
}

# 拉取Nginx镜像
echo "拉取nginx:latest..."
docker pull nginx:latest || {
    echo "⚠️  官方镜像拉取失败，尝试使用阿里云镜像..."
    docker pull registry.cn-hangzhou.aliyuncs.com/library/nginx:latest
    docker tag registry.cn-hangzhou.aliyuncs.com/library/nginx:latest nginx:latest
}

echo "✅ 镜像预拉取完成"

# 3. 验证镜像
echo "🔍 验证镜像..."
docker images | grep -E "(golang|alpine|nginx)"

echo ""
echo "🎉 Docker网络问题修复完成！"
echo "现在可以重新运行部署脚本："
echo "  ./deploy-remote.sh"