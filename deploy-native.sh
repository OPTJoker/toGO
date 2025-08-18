#!/bin/bash

# toGO 本地构建部署脚本 - 不依赖外部镜像

set -e

echo "🚀 开始本地构建部署 toGO..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查系统依赖
check_dependencies() {
    echo "🔍 检查系统依赖..."
    
    # 检查Go是否安装
    if ! command -v go &> /dev/null; then
        echo "安装Go..."
        wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
        sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        source ~/.bashrc
    fi
    
    # 检查Node.js是否安装
    if ! command -v node &> /dev/null; then
        echo "安装Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # 检查Nginx是否安装
    if ! command -v nginx &> /dev/null; then
        echo "安装Nginx..."
        sudo apt update
        sudo apt install -y nginx
    fi
    
    # 检查FFmpeg是否安装
    if ! command -v ffmpeg &> /dev/null; then
        echo "安装FFmpeg..."
        sudo apt install -y ffmpeg
    fi
    
    echo -e "${GREEN}✅ 系统依赖检查完成${NC}"
}

# 构建后端
build_backend() {
    echo "🔨 构建后端应用..."
    
    cd backend
    
    # 设置Go代理
    export GOPROXY=https://goproxy.cn,direct
    export GOSUMDB=off
    
    # 下载依赖
    go mod tidy
    go mod download
    
    # 构建应用
    CGO_ENABLED=0 GOOS=linux go build -o main .
    
    # 创建必要目录
    mkdir -p uploads output static
    
    cd ..
    
    echo -e "${GREEN}✅ 后端构建完成${NC}"
}

# 构建前端
build_frontend() {
    echo "🔨 构建前端应用..."
    
    cd frontend
    
    # 设置npm镜像
    npm config set registry https://registry.npmmirror.com
    
    # 安装依赖
    npm install
    
    # 构建应用
    VITE_API_BASE_URL=http://101.126.6.243/api VITE_STATIC_BASE_URL=http://101.126.6.243/static npm run build
    
    cd ..
    
    echo -e "${GREEN}✅ 前端构建完成${NC}"
}

# 配置Nginx
configure_nginx() {
    echo "⚙️ 配置Nginx..."
    
    sudo tee /etc/nginx/sites-available/togo > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;

    # 前端静态文件
    location / {
        root /var/www/togo;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # 静态文件代理到后端
    location /static/ {
        proxy_pass http://127.0.0.1:8080/static/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # 创建网站目录
    sudo mkdir -p /var/www/togo
    
    # 复制前端文件
    sudo cp -r frontend/dist/* /var/www/togo/
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/togo /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    sudo nginx -t
    
    echo -e "${GREEN}✅ Nginx配置完成${NC}"
}

# 创建系统服务
create_service() {
    echo "🔧 创建系统服务..."
    
    # 创建后端服务
    sudo tee /etc/systemd/system/togo-backend.service > /dev/null << EOF
[Unit]
Description=toGO Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PWD/backend
ExecStart=$PWD/backend/main
Restart=always
RestartSec=5
Environment=GIN_MODE=release
Environment=PORT=8080
Environment=BASE_URL=http://101.126.6.243
Environment=STATIC_BASE_URL=http://101.126.6.243/static

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载systemd
    sudo systemctl daemon-reload
    
    # 启用服务
    sudo systemctl enable togo-backend
    
    echo -e "${GREEN}✅ 系统服务创建完成${NC}"
}

# 启动服务
start_services() {
    echo "🚀 启动服务..."
    
    # 启动后端服务
    sudo systemctl start togo-backend
    
    # 启动Nginx
    sudo systemctl restart nginx
    
    echo -e "${GREEN}✅ 服务启动完成${NC}"
}

# 健康检查
health_check() {
    echo "🔍 健康检查..."
    
    # 等待服务启动
    sleep 10
    
    # 检查后端服务
    if systemctl is-active --quiet togo-backend; then
        echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    else
        echo -e "${RED}❌ 后端服务启动失败${NC}"
        sudo journalctl -u togo-backend --no-pager -n 20
    fi
    
    # 检查Nginx
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx运行正常${NC}"
    else
        echo -e "${RED}❌ Nginx启动失败${NC}"
        sudo journalctl -u nginx --no-pager -n 20
    fi
    
    # 检查API健康
    if curl -f http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ API服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️ API服务可能需要更多时间启动${NC}"
    fi
    
    # 检查前端
    if curl -f http://localhost >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️ 前端服务可能需要更多时间启动${NC}"
    fi
}

# 创建管理脚本
create_management_scripts() {
    echo "📝 创建管理脚本..."
    
    # 创建服务管理脚本
    cat > manage.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        sudo systemctl start togo-backend
        sudo systemctl start nginx
        echo "服务已启动"
        ;;
    stop)
        sudo systemctl stop togo-backend
        sudo systemctl stop nginx
        echo "服务已停止"
        ;;
    restart)
        sudo systemctl restart togo-backend
        sudo systemctl restart nginx
        echo "服务已重启"
        ;;
    status)
        echo "=== 后端服务状态 ==="
        sudo systemctl status togo-backend --no-pager -l
        echo "=== Nginx状态 ==="
        sudo systemctl status nginx --no-pager -l
        ;;
    logs)
        echo "=== 后端日志 ==="
        sudo journalctl -u togo-backend --no-pager -n 50
        ;;
    update)
        echo "更新应用..."
        git pull
        cd backend && go build -o main . && cd ..
        cd frontend && npm run build && cd ..
        sudo cp -r frontend/dist/* /var/www/togo/
        sudo systemctl restart togo-backend
        sudo systemctl reload nginx
        echo "更新完成"
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs|update}"
        exit 1
        ;;
esac
EOF

    chmod +x manage.sh
    
    echo -e "${GREEN}✅ 管理脚本创建完成${NC}"
}

# 主函数
main() {
    check_dependencies
    build_backend
    build_frontend
    configure_nginx
    create_service
    start_services
    health_check
    create_management_scripts
    
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "访问地址: http://101.126.6.243"
    echo ""
    echo "管理命令:"
    echo "  ./manage.sh start    - 启动服务"
    echo "  ./manage.sh stop     - 停止服务"
    echo "  ./manage.sh restart  - 重启服务"
    echo "  ./manage.sh status   - 查看状态"
    echo "  ./manage.sh logs     - 查看日志"
    echo "  ./manage.sh update   - 更新应用"
}

main "$@"
