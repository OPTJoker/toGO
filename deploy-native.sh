#!/bin/bash
# 原生部署脚本 - 不使用Docker
# 直接在Ubuntu主机上部署toGO服务

set -e

# 项目配置
PROJECT_NAME=togo
REMOTE_HOST=101.126.6.243
MYSQL_DB_NAME=togo_stats
SERVICE_USER=togo
INSTALL_DIR=/opt/togo
WEB_DIR=/var/www/togo

echo "🚀 开始原生部署 toGO 到远端主机 ${REMOTE_HOST}..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 1. 安装必要的依赖
echo "📦 安装系统依赖..."
apt update
apt install -y curl wget git nginx mysql-client build-essential

# 2. 安装Go (如果未安装)
if ! command -v go &> /dev/null; then
    echo "📦 安装Go语言..."
    GO_VERSION="1.21.5"
    wget -q https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz -O /tmp/go.tar.gz || {
        echo "❌ Go下载失败，请检查网络连接"
        exit 1
    }
    tar -C /usr/local -xzf /tmp/go.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    export PATH=$PATH:/usr/local/go/bin
    rm /tmp/go.tar.gz
fi

# 3. 安装Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "📦 安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# 4. 创建服务用户
echo "👤 创建服务用户..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $INSTALL_DIR $SERVICE_USER
fi

# 5. 创建目录结构
echo "📁 创建目录结构..."
mkdir -p $INSTALL_DIR
mkdir -p $WEB_DIR
mkdir -p $INSTALL_DIR/uploads
mkdir -p $INSTALL_DIR/output
mkdir -p $INSTALL_DIR/logs

# 6. 检查MySQL并创建数据库
echo "📊 配置数据库..."

# 检测MySQL服务名称
MYSQL_SERVICE=""
for service in mysql mysqld mariadb; do
    if systemctl list-unit-files | grep -q "^${service}.service"; then
        MYSQL_SERVICE=$service
        break
    fi
done

if [ -z "$MYSQL_SERVICE" ]; then
    echo "❌ 未找到MySQL服务，请先安装MySQL"
    echo "安装命令: apt install -y mysql-server"
    exit 1
fi

echo "检测到MySQL服务: $MYSQL_SERVICE"

if ! systemctl is-active --quiet $MYSQL_SERVICE; then
    echo "❌ MySQL服务未运行，正在启动..."
    systemctl start $MYSQL_SERVICE
    systemctl enable $MYSQL_SERVICE
    
    if ! systemctl is-active --quiet $MYSQL_SERVICE; then
        echo "❌ MySQL服务启动失败"
        echo "请手动启动: systemctl start $MYSQL_SERVICE"
        exit 1
    fi
    echo "✅ MySQL服务已启动"
fi

echo "请输入MySQL root密码来创建数据库："
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
    echo "❌ 数据库创建失败"
    exit 1
}

# 7. 构建后端
echo "🔨 构建后端应用..."
cd backend

# 设置Go代理
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=off

# 下载依赖并构建
go mod tidy
CGO_ENABLED=0 GOOS=linux go build -o main .

if [ ! -f "main" ]; then
    echo "❌ 后端构建失败"
    exit 1
fi

# 复制后端文件
cp main $INSTALL_DIR/
cp .env.production $INSTALL_DIR/.env
cd ..

# 8. 构建前端
echo "🔨 构建前端应用..."
cd frontend

# 设置npm镜像
npm config set registry https://registry.npmmirror.com

# 安装依赖并构建
npm install
VITE_API_BASE_URL=http://${REMOTE_HOST}/api VITE_STATIC_BASE_URL=http://${REMOTE_HOST}/static npm run build

if [ ! -d "dist" ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

# 复制前端文件
cp -r dist/* $WEB_DIR/
cd ..

# 9. 设置文件权限
echo "🔐 设置文件权限..."
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
chown -R www-data:www-data $WEB_DIR
chmod +x $INSTALL_DIR/main

# 10. 创建systemd服务
echo "⚙️ 创建systemd服务..."
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
Environment=PORT=8080
Environment=DB_HOST=localhost
Environment=DB_PORT=3306
Environment=DB_USER=root
Environment=DB_NAME=$MYSQL_DB_NAME

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=togo-backend

[Install]
WantedBy=multi-user.target
EOF

# 11. 配置Nginx
echo "🌐 配置Nginx..."
cat > /etc/nginx/sites-available/togo << EOF
server {
    listen 80;
    server_name _;
    
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
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # 静态文件代理
    location /static/ {
        proxy_pass http://localhost:8080/static/;
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
    echo "❌ Nginx配置错误"
    exit 1
fi

# 12. 启动服务
echo "🚀 启动服务..."

# 重新加载systemd
systemctl daemon-reload

# 启动并启用服务
systemctl enable togo-backend
systemctl start togo-backend

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

# 13. 等待服务启动并检查
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if systemctl is-active --quiet togo-backend; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    systemctl status togo-backend
    exit 1
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx启动成功"
else
    echo "❌ Nginx启动失败"
    systemctl status nginx
    exit 1
fi

# 14. 健康检查
echo "🏥 进行健康检查..."
sleep 3

if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ 后端API响应正常"
else
    echo "❌ 后端API无响应"
    journalctl -u togo-backend --no-pager -n 20
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ 前端页面响应正常"
else
    echo "❌ 前端页面无响应"
fi

echo ""
echo "🎉 原生部署完成！"
echo "📍 访问地址: http://${REMOTE_HOST}"
echo "📊 后端API: http://${REMOTE_HOST}/api"
echo "🏥 健康检查: http://${REMOTE_HOST}/api/health"
echo ""
echo "📋 服务管理命令:"
echo "  查看状态: systemctl status togo-backend"
echo "  查看日志: journalctl -u togo-backend -f"
echo "  重启服务: systemctl restart togo-backend"
echo "  停止服务: systemctl stop togo-backend"
echo ""
echo "📋 Nginx管理命令:"
echo "  查看状态: systemctl status nginx"
echo "  重启Nginx: systemctl restart nginx"
echo "  测试配置: nginx -t"