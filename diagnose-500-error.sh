#!/bin/bash
# 500错误快速诊断脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 诊断500内部服务器错误...${NC}"

# 1. 检查后端服务状态
echo -e "${BLUE}📊 检查后端服务状态...${NC}"
if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务正在运行${NC}"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo "服务状态："
    systemctl status togo-backend --no-pager -l
    exit 1
fi

# 2. 检查后端日志
echo -e "${BLUE}📋 检查后端错误日志...${NC}"
echo "最近的后端日志："
journalctl -u togo-backend --no-pager -n 20

# 3. 检查数据库连接
echo -e "${BLUE}🗄️ 检查数据库连接...${NC}"
if [ -f "/opt/togo/.env" ]; then
    DB_USER=$(grep "DB_USER=" /opt/togo/.env | cut -d'=' -f2)
    DB_PASSWORD=$(grep "DB_PASSWORD=" /opt/togo/.env | cut -d'=' -f2)
    DB_HOST=$(grep "DB_HOST=" /opt/togo/.env | cut -d'=' -f2)
    DB_PORT=$(grep "DB_PORT=" /opt/togo/.env | cut -d'=' -f2)
    DB_NAME=$(grep "DB_NAME=" /opt/togo/.env | cut -d'=' -f2)
    
    echo "数据库配置："
    echo "  主机: $DB_HOST"
    echo "  端口: $DB_PORT"
    echo "  用户: $DB_USER"
    echo "  数据库: $DB_NAME"
    
    # 测试数据库连接
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        echo "请检查MySQL密码和数据库配置"
    fi
else
    echo -e "${RED}❌ 环境配置文件不存在${NC}"
fi

# 4. 测试API端点
echo -e "${BLUE}🔍 测试API端点...${NC}"

# 测试健康检查
echo "测试健康检查API..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null)
HEALTH_CODE="${HEALTH_RESPONSE: -3}"
if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 健康检查API正常${NC}"
else
    echo -e "${RED}❌ 健康检查API失败 (HTTP $HEALTH_CODE)${NC}"
fi

# 测试访问记录API
echo "测试访问记录API..."
RECORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:8080/api/stats/record 2>/dev/null)
RECORD_CODE="${RECORD_RESPONSE: -3}"
if [ "$RECORD_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问记录API正常${NC}"
else
    echo -e "${RED}❌ 访问记录API失败 (HTTP $RECORD_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
fi

# 5. 检查端口占用
echo -e "${BLUE}🔌 检查端口占用...${NC}"
if netstat -tlnp | grep :8080 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 端口8080正在监听${NC}"
    netstat -tlnp | grep :8080
else
    echo -e "${RED}❌ 端口8080未监听${NC}"
fi

echo ""
echo -e "${BLUE}📋 建议的修复步骤：${NC}"
echo "1. 运行修复脚本：sudo ./fix-404-error.sh"
echo "2. 检查MySQL密码：sudo nano /opt/togo/.env"
echo "3. 重启后端服务：sudo systemctl restart togo-backend"
echo "4. 查看实时日志：sudo journalctl -u togo-backend -f"