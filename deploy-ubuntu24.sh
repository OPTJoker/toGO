#!/bin/bash

# Ubuntu 24.04 专用部署脚本

set -e

echo "🚀 Ubuntu 24.04 部署 toGO..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "系统信息："
cat /etc/os-release | grep PRETTY_NAME
echo ""

# 第一步：安装Go
# 修改deploy-ubuntu24.sh中的install_go函数
install_go() {
    echo "📦 安装Go..."
    
    if command -v go &> /dev/null; then
        echo "Go已安装: $(go version)"
        return 0
    fi
    
    # 下载最新的Go 1.22版本
    cd /tmp
    echo "下载Go 1.22.10..."
    wget -q https://go.dev/dl/go1.22.10.linux-amd64.tar.gz
    
    # 安装Go
    echo "安装Go到/usr/local/go..."
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf go1.22.10.linux-amd64.tar.gz
    rm -f go1.22.10.linux-amd64.tar.gz
    
    # 设置环境变量（不禁用GOSUMDB）
    echo "设置Go环境变量..."
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export GOROOT=/usr/local/go' >> ~/.bashrc
        echo 'export GOPROXY=https://goproxy.cn,http://artifactory.intra.ke.com/artifactory/api/go/go-local-repository,direct' >> ~/.bashrc
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

# 第二步：安装Node.js
install_nodejs() {
    echo "📦 安装Node.js..."
    
    if command -v node &> /dev/null; then
        echo "Node.js已安装: $(node --version)"
        return 0
    fi
    
    # 安装Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # 验证安装
    if node --version && npm --version; then
        echo -e "${GREEN}✅ Node.js安装成功${NC}"
    else
        echo -e "${RED}❌ Node.js安装失败${NC}"
        exit 1
    fi
}

# 第三步：安装其他依赖和数据库
install_other_deps() {
    echo "📦 安装其他依赖..."
    
    sudo apt update
    
    # 安装Nginx
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
        echo "Nginx已安装"
    fi
    
    # 安装FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        sudo apt install -y ffmpeg
        echo "FFmpeg已安装"
    fi

    # 安装MySQL
    if ! command -v mysql &> /dev/null; then
        echo "📦 安装MySQL..."
        sudo apt install -y mysql-server
        sudo systemctl enable mysql
        sudo systemctl start mysql
        echo "MySQL已安装并启动"
    fi

    # 创建数据库 toGO（如果不存在）
    echo "🔧 检查并创建数据库 toGO..."
    DB_EXISTS=$(sudo mysql -uroot -e "SHOW DATABASES LIKE 'toGO';" | grep toGO || true)
    if [ -z "$DB_EXISTS" ]; then
        sudo mysql -uroot -e "CREATE DATABASE toGO DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        echo "✅ 数据库 toGO 已创建"
    else
        echo "数据库 toGO 已存在"
    fi

    echo -e "${GREEN}✅ 所有依赖安装完成${NC}"
}

# 第四步：构建后端
build_backend() {
    echo "🔨 构建后端..."
    
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
    
    # 设置Go代理
    export GOPROXY=https://goproxy.cn,http://artifactory.intra.ke.com/artifactory/api/go/go-local-repository,direct
    # export GOSUMDB=off
    
    # 构建
    $GO_CMD mod tidy
    $GO_CMD mod download
    CGO_ENABLED=0 GOOS=linux $GO_CMD build -o main .
    
    # 创建目录
    mkdir -p uploads output static
    chmod 755 uploads output static
    
    cd ..
    echo -e "${GREEN}✅ 后端构建完成${NC}"
}

# 第五步：构建前端
build_frontend() {
    echo "🔨 构建前端..."
    
    cd frontend
    
    # 设置npm镜像
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    npm install
    
    # 构建（注意IP地址）
    VITE_API_BASE_URL=http://101.126.6.243/api VITE_STATIC_BASE_URL=http://101.126.6.243/static npm run build
    
    cd ..
    echo -e "${GREEN}✅ 前端构建完成${NC}"
}

# 第六步：配置Nginx
setup_nginx() {
    echo "⚙️ 配置Nginx..."
    
    # 创建网站目录
    sudo mkdir -p /var/www/togo
    sudo cp -r frontend/dist/* /var/www/togo/
    sudo chown -R www-data:www-data /var/www/togo
    
    # 创建Nginx配置
    sudo tee /etc/nginx/sites-available/togo > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;

    location / {
        root /var/www/togo;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /static/ {
        proxy_pass http://127.0.0.1:8080/static/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        expires 1d;
    }
}
EOF

    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/togo /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    sudo nginx -t
    echo -e "${GREEN}✅ Nginx配置完成${NC}"
}

# 第七步：创建系统服务
create_service() {
    echo "🔧 创建系统服务..."
    
    CURRENT_DIR=$(pwd)
    
    sudo tee /etc/systemd/system/togo-backend.service > /dev/null << EOF
[Unit]
Description=toGO Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$CURRENT_DIR/backend
ExecStart=$CURRENT_DIR/backend/main
Restart=always
RestartSec=5
Environment=PATH=/usr/local/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=GIN_MODE=release
Environment=PORT=8080
Environment=BASE_URL=http://101.126.6.243
Environment=STATIC_BASE_URL=http://101.126.6.243/static

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable togo-backend
    echo -e "${GREEN}✅ 系统服务创建完成${NC}"
}

# 第八步：启动服务
start_services() {
    echo "🚀 启动服务..."
    
    sudo systemctl start togo-backend
    sudo systemctl start nginx
    
    echo -e "${GREEN}✅ 服务启动完成${NC}"
}

# 第九步：验证部署
verify_deployment() {
    echo "🔍 验证部署..."
    
    sleep 5
    
    # 检查服务状态
    if systemctl is-active --quiet togo-backend; then
        echo -e "${GREEN}✅ 后端服务运行中${NC}"
    else
        echo -e "${RED}❌ 后端服务异常${NC}"
        sudo systemctl status togo-backend --no-pager -l
    fi
    
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx运行中${NC}"
    else
        echo -e "${RED}❌ Nginx异常${NC}"
    fi
    
    # 测试端口
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
    
    # 测试API
    sleep 3
    if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端API正常${NC}"
    else
        echo -e "${YELLOW}⚠️ 后端API需要更多时间启动${NC}"
    fi
    
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端代理正常${NC}"
    else
        echo -e "${YELLOW}⚠️ 前端代理需要更多时间${NC}"
    fi
}

# 主执行流程
main() {
    install_go
    install_nodejs  
    install_other_deps
    build_backend
    build_frontend
    setup_nginx
    create_service
    start_services
    verify_deployment
    
    # 设置管理脚本权限
    chmod +x manage.sh 2>/dev/null || echo "manage.sh不存在，稍后创建"
    
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo ""
    echo "访问地址: http://101.126.6.243"
    echo ""
    echo "管理命令:"
    echo "  sudo systemctl start togo-backend    - 启动后端"
    echo "  sudo systemctl stop togo-backend     - 停止后端" 
    echo "  sudo systemctl restart togo-backend  - 重启后端"
    echo "  sudo systemctl status togo-backend   - 查看状态"
    echo "  sudo journalctl -u togo-backend -f   - 查看日志"
    echo ""
}

main "$@"
