#!/bin/bash
# 重新部署后端服务以应用CORS配置更改

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 重新部署后端服务以修复CORS问题...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 项目配置
INSTALL_DIR=/opt/togo

# 检查是否在项目根目录
if [ ! -f "backend/main.go" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}🛑 停止后端服务...${NC}"
systemctl stop togo-backend

echo -e "${BLUE}🔨 重新构建后端...${NC}"
cd backend

# 确保Go可用
export PATH=$PATH:/usr/local/go/bin
GO_CMD="/usr/local/go/bin/go"

if [ ! -f "$GO_CMD" ]; then
    GO_CMD="go"
fi

echo "使用Go: $($GO_CMD version)"

# 设置Go代理和环境变量
export GOPROXY=https://goproxy.cn,http://artifactory.intra.ke.com/artifactory/api/go/go-local-repository,direct
export GOROOT=/usr/local/go

# 下载依赖并构建
$GO_CMD mod tidy
$GO_CMD mod download
CGO_ENABLED=0 GOOS=linux $GO_CMD build -o main .

if [ ! -f "main" ]; then
    echo -e "${RED}❌ 后端构建失败${NC}"
    exit 1
fi

echo -e "${BLUE}📁 更新后端文件...${NC}"
cp main $INSTALL_DIR/

cd ..

echo -e "${GREEN}✅ 后端构建完成${NC}"

echo -e "${BLUE}🔧 更新systemd服务配置...${NC}"
# 更新systemd服务文件以包含新的环境变量
cat > /etc/systemd/system/togo-backend.service << EOF
[Unit]
Description=ToGo Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/main
Restart=always
RestartSec=5
Environment=STATIC_DIR=/opt/togo/output
Environment=UPLOAD_DIR=/opt/togo/uploads

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
systemctl daemon-reload

echo -e "${BLUE}🚀 启动后端服务...${NC}"
systemctl start togo-backend

# 等待服务启动
sleep 3

if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    systemctl status togo-backend --no-pager -l
    exit 1
fi

# 检查端口
if ss -tlnp | grep :8080 >/dev/null; then
    echo -e "${GREEN}✅ 后端端口8080正常${NC}"
else
    echo -e "${RED}❌ 后端端口8080异常${NC}"
fi

# 健康检查
echo -e "${BLUE}🏥 进行健康检查...${NC}"
sleep 2

if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端API响应正常${NC}"
else
    echo -e "${YELLOW}⚠️ 后端API需要更多时间启动${NC}"
    journalctl -u togo-backend --no-pager -n 10
fi

echo ""
echo -e "${GREEN}🎉 后端服务重新部署完成！${NC}"
echo -e "${BLUE}📍 现在支持以下域名的CORS访问:${NC}"
echo "  http://tugou.site"
echo "  https://tugou.site"
echo "  http://www.tugou.site"
echo "  https://www.tugou.site"
echo "  http://101.126.6.243"
echo ""
echo -e "${BLUE}🔧 如果仍有CORS问题，请检查:${NC}"
echo "1. 浏览器是否缓存了旧的CORS策略（尝试硬刷新 Ctrl+F5）"
echo "2. 前端请求的域名是否与当前访问域名一致"
echo "3. 查看后端日志: journalctl -u togo-backend -f"