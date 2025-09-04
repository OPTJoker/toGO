#!/bin/bash
# 重启前端服务脚本
# 重新构建并部署前端应用

set -e

# 项目配置
REMOTE_HOST="101.126.6.243"
WEB_DIR="/var/www/togo"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 重新部署前端服务中...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js未安装，请先安装Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm未安装，请先安装npm${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Node.js版本: $(node --version)${NC}"
echo -e "${BLUE}📦 npm版本: $(npm --version)${NC}"

# 进入前端目录
cd frontend

echo -e "${BLUE}🔧 设置npm镜像...${NC}"
npm config set registry https://registry.npmmirror.com

echo -e "${BLUE}📦 安装前端依赖...${NC}"
npm install

echo -e "${BLUE}🔨 构建前端应用...${NC}"
VITE_API_BASE_URL=http://${REMOTE_HOST}/api VITE_STATIC_BASE_URL=http://${REMOTE_HOST}/static npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 前端构建失败，dist目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 前端构建完成${NC}"

# 备份现有前端文件（可选）
if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR)" ]; then
    echo -e "${BLUE}💾 备份现有前端文件...${NC}"
    BACKUP_DIR="/tmp/togo-frontend-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "$WEB_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
    echo -e "${GREEN}✅ 备份完成: $BACKUP_DIR${NC}"
fi

# 清理现有前端文件
echo -e "${BLUE}🧹 清理现有前端文件...${NC}"
rm -rf "$WEB_DIR"/*

# 复制新的前端文件
echo -e "${BLUE}📁 部署新的前端文件...${NC}"
cp -r dist/* "$WEB_DIR"/

# 设置文件权限
echo -e "${BLUE}🔐 设置文件权限...${NC}"
chown -R www-data:www-data "$WEB_DIR"
chmod -R 755 "$WEB_DIR"

# 返回项目根目录
cd ..

echo -e "${GREEN}✅ 前端文件部署完成${NC}"

# 测试Nginx配置
echo -e "${BLUE}🔍 测试Nginx配置...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx配置正常${NC}"
else
    echo -e "${RED}❌ Nginx配置错误${NC}"
    exit 1
fi

# 重新加载Nginx
echo -e "${BLUE}🔄 重新加载Nginx...${NC}"
systemctl reload nginx

# 检查Nginx状态
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx服务正常运行${NC}"
else
    echo -e "${RED}❌ Nginx服务异常${NC}"
    systemctl status nginx --no-pager -l
    exit 1
fi

# 检查端口
if ss -tlnp | grep :80 >/dev/null; then
    echo -e "${GREEN}✅ 前端端口80正常${NC}"
else
    echo -e "${RED}❌ 前端端口80异常${NC}"
fi

echo ""
echo -e "${GREEN}🎉 前端服务重新部署完成！${NC}"
echo -e "${BLUE}📍 访问地址:${NC}"
echo "  http://tugou.site"
echo "  https://tugou.site"
echo "  http://www.tugou.site"
echo "  https://www.tugou.site"
echo "  http://${REMOTE_HOST}"
echo ""
echo -e "${BLUE}📋 相关命令:${NC}"
echo "  systemctl status nginx        - 查看Nginx状态"
echo "  systemctl reload nginx        - 重新加载Nginx配置"
echo "  nginx -t                      - 测试Nginx配置"
echo "  ls -la ${WEB_DIR}             - 查看前端文件"
echo ""