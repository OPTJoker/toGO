#!/bin/bash
# 更新nginx配置以支持域名访问

set -e

# 项目配置
REMOTE_HOST=101.126.6.243
WEB_DIR=/var/www/togo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 更新nginx配置以支持域名tugou.site...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 备份现有配置
if [ -f "/etc/nginx/sites-available/togo" ]; then
    echo -e "${YELLOW}📋 备份现有配置...${NC}"
    cp /etc/nginx/sites-available/togo /etc/nginx/sites-available/togo.backup.$(date +%Y%m%d_%H%M%S)
fi

# 创建新的nginx配置
echo -e "${BLUE}📝 创建新的nginx配置...${NC}"
cat > /etc/nginx/sites-available/togo << EOF
server {
    listen 80;
    server_name tugou.site www.tugou.site ${REMOTE_HOST} _;
    
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
echo -e "${BLUE}🔗 启用站点配置...${NC}"
ln -sf /etc/nginx/sites-available/togo /etc/nginx/sites-enabled/

# 测试nginx配置
echo -e "${BLUE}🧪 测试nginx配置...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ nginx配置测试通过${NC}"
else
    echo -e "${RED}❌ nginx配置测试失败${NC}"
    exit 1
fi

# 重启nginx
echo -e "${BLUE}🔄 重启nginx服务...${NC}"
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ nginx重启成功${NC}"
else
    echo -e "${RED}❌ nginx重启失败${NC}"
    systemctl status nginx --no-pager -l
    exit 1
fi

# 等待服务稳定
sleep 2

# 进行健康检查
echo -e "${BLUE}🏥 进行健康检查...${NC}"

# 检查IP访问
if curl -f -s http://localhost > /dev/null; then
    echo -e "${GREEN}✅ IP访问正常: http://${REMOTE_HOST}${NC}"
else
    echo -e "${RED}❌ IP访问异常${NC}"
fi

# 检查API
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ API访问正常: http://${REMOTE_HOST}/api${NC}"
else
    echo -e "${RED}❌ API访问异常${NC}"
fi

# 域名解析检查
echo -e "${BLUE}🔍 检查域名解析...${NC}"
if nslookup tugou.site > /dev/null 2>&1; then
    DOMAIN_IP=$(nslookup tugou.site | grep -A1 "Name:" | tail -1 | awk '{print $2}' 2>/dev/null || echo "未知")
    if [ "$DOMAIN_IP" = "$REMOTE_HOST" ]; then
        echo -e "${GREEN}✅ 域名解析正确: tugou.site -> ${DOMAIN_IP}${NC}"
    else
        echo -e "${YELLOW}⚠️ 域名解析: tugou.site -> ${DOMAIN_IP} (期望: ${REMOTE_HOST})${NC}"
        echo -e "${YELLOW}   请检查DNS设置${NC}"
    fi
else
    echo -e "${RED}❌ 域名解析失败${NC}"
fi

echo ""
echo -e "${GREEN}🎉 nginx配置更新完成！${NC}"
echo -e "${BLUE}📍 现在支持以下访问方式:${NC}"
echo "  http://tugou.site"
echo "  http://www.tugou.site"
echo "  http://${REMOTE_HOST}"
echo ""
echo -e "${BLUE}📊 API访问:${NC}"
echo "  http://tugou.site/api"
echo "  http://${REMOTE_HOST}/api"
echo ""
echo -e "${BLUE}🏥 健康检查:${NC}"
echo "  http://tugou.site/api/health"
echo "  http://${REMOTE_HOST}/api/health"
echo ""

# 显示当前nginx配置
echo -e "${BLUE}📋 当前nginx配置:${NC}"
echo "server_name: tugou.site www.tugou.site ${REMOTE_HOST} _"
echo ""

# 诊断建议
echo -e "${BLUE}🔧 如果域名访问仍有问题，请检查:${NC}"
echo "1. DNS解析是否正确指向 ${REMOTE_HOST}"
echo "2. 域名是否已生效（可能需要等待DNS传播）"
echo "3. 防火墙是否开放80端口"
echo "4. 使用以下命令查看nginx日志:"
echo "   tail -f /var/log/nginx/access.log"
echo "   tail -f /var/log/nginx/error.log"