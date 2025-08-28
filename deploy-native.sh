#!/bin/bash
# 原生部署脚本 - 不使用Docker
# 直接在Ubuntu主机上部署toGO服务 - 增强版

set -e

# 项目配置
PROJECT_NAME=togo
REMOTE_HOST=101.126.6.243
MYSQL_DB_NAME=toGO  # 修改为toGO数据库名
MYSQL_DB_PW=root123456  # 请修改为实际的MySQL root密码
SERVICE_USER=togo
INSTALL_DIR=/opt/togo
WEB_DIR=/var/www/togo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 开始原生部署 toGO 到远端主机 ${REMOTE_HOST}..."

echo "系统信息："
cat /etc/os-release | grep PRETTY_NAME || echo "Unknown system"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 安装必要的依赖
echo -e "${BLUE}📦 安装系统依赖...${NC}"
apt update
apt install -y curl wget git nginx mysql-client build-essential ffmpeg netcat-openbsd

# 2. 安装Go (如果未安装) - 增强版
install_go() {
    echo -e "${BLUE}📦 安装Go...${NC}"
    
    if command -v go version &> /dev/null; then
        echo -e "${GREEN}Go已安装: $(go version)${NC}"
        return 0
    fi
    
    # 下载最新的Go 1.22版本
    cd /tmp
    echo "下载Go 1.22.10..."
    wget -q https://go.dev/dl/go1.22.10.linux-amd64.tar.gz || {
        echo -e "${RED}❌ Go下载失败，请检查网络连接${NC}"
        exit 1
    }
    
    # 安装Go
    echo "安装Go到/usr/local/go..."
    rm -rf /usr/local/go
    tar -C /usr/local -xzf go1.22.10.linux-amd64.tar.gz
    rm -f go1.22.10.linux-amd64.tar.gz
    
    # 设置环境变量
    echo "设置Go环境变量..."
    if ! grep -q "/usr/local/go/bin" /etc/profile; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
        echo 'export GOROOT=/usr/local/go' >> /etc/profile
        echo 'export GOPROXY=https://goproxy.cn,http://artifactory.intra.ke.com/artifactory/api/go/go-local-repository,direct' >> /etc/profile
    fi
    
    export PATH=$PATH:/usr/local/go/bin
    export GOROOT=/usr/local/go
    export GOPROXY=https://goproxy.cn,http://artifactory.intra.ke.com/artifactory/api/go/go-local-repository,direct
    
    # 验证安装
    if /usr/local/go/bin/go version; then
        echo -e "${GREEN}✅ Go安装成功${NC}"
    else
        echo -e "${RED}❌ Go安装失败${NC}"
        exit 1
    fi
}

# 3. 安装Node.js (如果未安装) - 增强版
install_nodejs() {
    echo -e "${BLUE}📦 安装Node.js...${NC}"
    
    if command -v node &> /dev/null; then
        echo -e "${GREEN}Node.js已安装: $(node --version)${NC}"
        return 0
    fi
    
    # 安装Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # 验证安装
    if node --version && npm --version; then
        echo -e "${GREEN}✅ Node.js安装成功${NC}"
    else
        echo -e "${RED}❌ Node.js安装失败${NC}"
        exit 1
    fi
}

# 调用安装函数
install_go
install_nodejs

# 4. 创建服务用户
echo -e "${BLUE}👤 创建服务用户...${NC}"
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $INSTALL_DIR $SERVICE_USER
fi

# 5. 创建目录结构
echo -e "${BLUE}📁 创建目录结构...${NC}"
mkdir -p $INSTALL_DIR
mkdir -p $WEB_DIR
mkdir -p $INSTALL_DIR/uploads
mkdir -p $INSTALL_DIR/output
mkdir -p $INSTALL_DIR/static
mkdir -p $INSTALL_DIR/logs

# 6. 检查MySQL并创建数据库 - 增强版
echo -e "${BLUE}📊 配置数据库...${NC}"

# 检测MySQL服务名称
MYSQL_SERVICE=""
for service in mysql mysqld mariadb; do
    if systemctl list-unit-files | grep -q "^${service}.service"; then
        MYSQL_SERVICE=$service
        break
    fi
done

if [ -z "$MYSQL_SERVICE" ]; then
    echo -e "${RED}❌ 未找到MySQL服务，请先安装MySQL${NC}"
    echo "安装命令: apt install -y mysql-server"
    exit 1
fi

echo -e "${GREEN}检测到MySQL服务: $MYSQL_SERVICE${NC}"

if ! systemctl is-active --quiet $MYSQL_SERVICE; then
    echo -e "${YELLOW}❌ MySQL服务未运行，正在启动...${NC}"
    systemctl start $MYSQL_SERVICE
    systemctl enable $MYSQL_SERVICE
    
    if ! systemctl is-active --quiet $MYSQL_SERVICE; then
        echo -e "${RED}❌ MySQL服务启动失败${NC}"
        echo "请手动启动: systemctl start $MYSQL_SERVICE"
        exit 1
    fi
    echo -e "${GREEN}✅ MySQL服务已启动${NC}"
fi

# 创建数据库（使用toGO作为数据库名）
echo "🔧 检查并创建数据库 ${MYSQL_DB_NAME}..."
DB_EXISTS=$(mysql -uroot -e "SHOW DATABASES LIKE '${MYSQL_DB_NAME}';" 2>/dev/null | grep ${MYSQL_DB_NAME} || true)
if [ -z "$DB_EXISTS" ]; then
    echo "请输入MySQL root密码来创建数据库："
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
        echo -e "${RED}❌ 数据库创建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 数据库 ${MYSQL_DB_NAME} 已创建${NC}"
else
    echo -e "${GREEN}数据库 ${MYSQL_DB_NAME} 已存在${NC}"
fi

# 7. 构建后端 - 增强版
echo -e "${BLUE}🔨 构建后端应用...${NC}"

# 确保在项目目录
if [ ! -f "backend/main.go" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

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

# 创建必要的目录并设置权限
mkdir -p uploads output static
chmod 755 uploads output static

# 停止后端服务（如果正在运行）以避免"Text file busy"错误
echo -e "${YELLOW}🛑 停止现有后端服务...${NC}"
systemctl stop togo-backend 2>/dev/null || true
sleep 2

# 复制后端文件
echo -e "${BLUE}📁 复制后端文件...${NC}"
cp main $INSTALL_DIR/
cp .env.production $INSTALL_DIR/.env
cd ..

echo -e "${GREEN}✅ 后端构建完成${NC}"

# 8. 构建前端 - 增强版
echo -e "${BLUE}🔨 构建前端应用...${NC}"
cd frontend

# 设置npm镜像
npm config set registry https://registry.npmmirror.com

# 安装依赖并构建
npm install
VITE_API_BASE_URL=http://${REMOTE_HOST}/api VITE_STATIC_BASE_URL=http://${REMOTE_HOST}/static npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi

# 复制前端文件
cp -r dist/* $WEB_DIR/
cd ..

echo -e "${GREEN}✅ 前端构建完成${NC}"

# 9. 设置文件权限
echo -e "${BLUE}🔐 设置文件权限...${NC}"
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
chown -R www-data:www-data $WEB_DIR
chmod +x $INSTALL_DIR/main

# 10. 创建systemd服务 - 增强版
echo -e "${BLUE}⚙️ 创建systemd服务...${NC}"
cat > /etc/systemd/system/togo-backend.service << EOF
[Unit]
Description=toGO Backend Service
After=network.target ${MYSQL_SERVICE}.service
Wants=${MYSQL_SERVICE}.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/main
Restart=always
RestartSec=5
Environment=PATH=/usr/local/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=GIN_MODE=release
Environment=PORT=8080
Environment=BASE_URL=http://${REMOTE_HOST}
Environment=STATIC_BASE_URL=http://${REMOTE_HOST}/static
Environment=DB_HOST=localhost
Environment=DB_PORT=3306
Environment=DB_USER=root
Environment=DB_PASSWORD=$MYSQL_DB_PW
Environment=DB_NAME=$MYSQL_DB_NAME

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=togo-backend

[Install]
WantedBy=multi-user.target
EOF

# 11. 配置Nginx - 增强版
echo -e "${BLUE}🌐 配置Nginx...${NC}"
cat > /etc/nginx/sites-available/togo << EOF
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    # 前端静态文件
    location / {
        root $WEB_DIR;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # 静态文件代理
    location /static/ {
        proxy_pass http://127.0.0.1:8080/static/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/togo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx配置错误${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx配置完成${NC}"

# 12. 启动服务
echo -e "${BLUE}🚀 启动服务...${NC}"

# 重新加载systemd
systemctl daemon-reload

# 启动并启用服务（不需要重复启动，因为前面已经停止了）
systemctl enable togo-backend
systemctl start togo-backend

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}✅ 服务启动完成${NC}"

# 13. 等待服务启动并检查 - 增强版
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 5

# 检查服务状态
echo -e "${BLUE}🔍 检查服务状态...${NC}"
if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    systemctl status togo-backend --no-pager -l
    exit 1
fi

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx启动成功${NC}"
else
    echo -e "${RED}❌ Nginx启动失败${NC}"
    systemctl status nginx --no-pager -l
    exit 1
fi

# 检查端口
if ss -tlnp | grep :8080 >/dev/null; then
    echo -e "${GREEN}✅ 后端端口8080正常${NC}"
else
    echo -e "${RED}❌ 后端端口8080异常${NC}"
fi

if ss -tlnp | grep :80 >/dev/null; then
    echo -e "${GREEN}✅ 前端端口80正常${NC}"
else
    echo -e "${RED}❌ 前端端口80异常${NC}"
fi

# 14. 健康检查 - 增强版
echo -e "${BLUE}🏥 进行健康检查...${NC}"
sleep 3

if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端API响应正常${NC}"
else
    echo -e "${YELLOW}⚠️ 后端API需要更多时间启动${NC}"
    journalctl -u togo-backend --no-pager -n 20
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端页面响应正常${NC}"
else
    echo -e "${YELLOW}⚠️ 前端页面需要更多时间${NC}"
fi

if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端代理正常${NC}"
else
    echo -e "${YELLOW}⚠️ 前端代理需要更多时间${NC}"
fi

# 设置管理脚本权限
chmod +x manage-ubuntu.sh 2>/dev/null || echo "manage-ubuntu.sh不存在，稍后创建"

echo ""
echo -e "${GREEN}🎉 原生部署完成！${NC}"
echo -e "${BLUE}📍 访问地址: http://${REMOTE_HOST}${NC}"
echo -e "${BLUE}📊 后端API: http://${REMOTE_HOST}/api${NC}"
echo -e "${BLUE}🏥 健康检查: http://${REMOTE_HOST}/api/health${NC}"
echo ""
echo -e "${BLUE}📋 服务管理命令:${NC}"
echo "  systemctl status togo-backend     - 查看状态"
echo "  journalctl -u togo-backend -f     - 查看日志"
echo "  systemctl restart togo-backend    - 重启服务"
echo "  systemctl stop togo-backend       - 停止服务"
echo ""
echo -e "${BLUE}📋 Nginx管理命令:${NC}"
echo "  systemctl status nginx            - 查看状态"
echo "  systemctl restart nginx           - 重启Nginx"
echo "  nginx -t                          - 测试配置"
echo ""
echo -e "${BLUE}📋 其他管理:${NC}"
echo "  ./manage-ubuntu.sh status         - 完整状态检查"
echo "  ./manage-ubuntu.sh logs           - 查看所有日志"
echo "  ./manage-ubuntu.sh health         - 健康检查"