#!/bin/bash
# 修复访问统计500错误的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 修复访问统计500错误...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 检查MySQL服务状态
echo -e "${BLUE}🔍 检查MySQL服务状态...${NC}"
if ! systemctl is-active --quiet mysql; then
    echo -e "${RED}❌ MySQL服务未运行，正在启动...${NC}"
    systemctl start mysql
    sleep 3
fi

if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL服务运行正常${NC}"
else
    echo -e "${RED}❌ MySQL服务启动失败${NC}"
    systemctl status mysql
    exit 1
fi

# 2. 检查数据库配置
echo -e "${BLUE}📊 检查数据库配置...${NC}"

# 检查数据库是否存在
DB_EXISTS=$(mysql -uroot -e "SHOW DATABASES LIKE 'toGO';" 2>/dev/null | grep toGO || true)
if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️ 数据库toGO不存在，正在创建...${NC}"
    echo "请输入MySQL root密码："
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS toGO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
        echo -e "${RED}❌ 数据库创建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 数据库toGO已创建${NC}"
else
    echo -e "${GREEN}✅ 数据库toGO已存在${NC}"
fi

# 3. 更新环境变量配置
echo -e "${BLUE}⚙️ 更新环境变量配置...${NC}"

# 检查.env文件是否存在
if [ ! -f "/opt/togo/.env" ]; then
    echo -e "${RED}❌ 环境配置文件不存在${NC}"
    exit 1
fi

# 更新数据库配置
sed -i 's/DB_NAME=togo_stats/DB_NAME=toGO/g' /opt/togo/.env
sed -i 's/DB_HOST=host.docker.internal/DB_HOST=localhost/g' /opt/togo/.env

echo -e "${GREEN}✅ 环境配置已更新${NC}"

# 4. 检查并更新MySQL密码配置
echo -e "${BLUE}🔐 检查MySQL密码配置...${NC}"

# 显示当前配置
echo "当前数据库配置："
grep "DB_" /opt/togo/.env

# 检查密码是否为默认值
if grep -q "DB_PASSWORD=your_mysql_password_here" /opt/togo/.env; then
    echo -e "${YELLOW}⚠️ 检测到默认密码，需要更新${NC}"
    echo "请输入实际的MySQL root密码："
    read -s mysql_password
    sed -i "s/DB_PASSWORD=your_mysql_password_here/DB_PASSWORD=$mysql_password/g" /opt/togo/.env
    echo -e "${GREEN}✅ MySQL密码已更新${NC}"
fi

# 5. 测试数据库连接
echo -e "${BLUE}🔍 测试数据库连接...${NC}"

# 从.env文件读取配置
DB_USER=$(grep "DB_USER=" /opt/togo/.env | cut -d'=' -f2)
DB_PASSWORD=$(grep "DB_PASSWORD=" /opt/togo/.env | cut -d'=' -f2)
DB_HOST=$(grep "DB_HOST=" /opt/togo/.env | cut -d'=' -f2)
DB_PORT=$(grep "DB_PORT=" /opt/togo/.env | cut -d'=' -f2)
DB_NAME=$(grep "DB_NAME=" /opt/togo/.env | cut -d'=' -f2)

# 测试数据库连接
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接测试成功${NC}"
else
    echo -e "${RED}❌ 数据库连接测试失败${NC}"
    echo "请检查以下配置："
    echo "  主机: $DB_HOST"
    echo "  端口: $DB_PORT"
    echo "  用户: $DB_USER"
    echo "  数据库: $DB_NAME"
    echo ""
    echo "手动测试连接："
    echo "  mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD -e 'USE $DB_NAME; SELECT 1;'"
    exit 1
fi

# 6. 检查数据库表
echo -e "${BLUE}📋 检查数据库表...${NC}"

# 检查visitor_records表是否存在
TABLE_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES LIKE 'visitor_records';" 2>/dev/null | grep visitor_records || true)
if [ -z "$TABLE_EXISTS" ]; then
    echo -e "${YELLOW}⚠️ visitor_records表不存在，后端启动时会自动创建${NC}"
else
    echo -e "${GREEN}✅ visitor_records表已存在${NC}"
    # 显示表结构
    echo "表结构："
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; DESCRIBE visitor_records;" 2>/dev/null || true
fi

# 7. 重启后端服务
echo -e "${BLUE}🔄 重启后端服务...${NC}"
systemctl restart togo-backend

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 8

# 8. 检查服务状态和日志
echo -e "${BLUE}🔍 检查服务状态...${NC}"
if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${RED}❌ 后端服务异常${NC}"
    echo "服务状态："
    systemctl status togo-backend --no-pager -l
    echo ""
    echo "最近日志："
    journalctl -u togo-backend --no-pager -n 30
    exit 1
fi

# 9. 检查服务日志中的数据库连接
echo -e "${BLUE}📋 检查数据库连接日志...${NC}"
if journalctl -u togo-backend --no-pager -n 20 | grep -i "database connected" >/dev/null; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
elif journalctl -u togo-backend --no-pager -n 20 | grep -i "database" >/dev/null; then
    echo -e "${YELLOW}⚠️ 发现数据库相关日志：${NC}"
    journalctl -u togo-backend --no-pager -n 20 | grep -i "database"
else
    echo -e "${YELLOW}⚠️ 未发现数据库连接日志${NC}"
fi

# 10. 测试API连接
echo -e "${BLUE}🏥 测试API连接...${NC}"
sleep 3

if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端API连接正常${NC}"
else
    echo -e "${RED}❌ 后端API连接失败${NC}"
    echo "查看详细日志："
    journalctl -u togo-backend --no-pager -n 10
    exit 1
fi

# 11. 测试访问统计API
echo -e "${BLUE}📊 测试访问统计API...${NC}"

# 测试记录访问
echo "测试POST /api/stats/record..."
RECORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:8080/api/stats/record)
RECORD_HTTP_CODE="${RECORD_RESPONSE: -3}"

if [ "$RECORD_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问统计记录API正常${NC}"
else
    echo -e "${RED}❌ 访问统计记录API失败 (HTTP $RECORD_HTTP_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
    echo ""
    echo "检查后端日志："
    journalctl -u togo-backend --no-pager -n 10
fi

# 测试获取统计
echo "测试GET /api/stats/visitors..."
VISITORS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8080/api/stats/visitors)
VISITORS_HTTP_CODE="${VISITORS_RESPONSE: -3}"

if [ "$VISITORS_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问统计查询API正常${NC}"
    echo "统计数据："
    echo "$VISITORS_RESPONSE" | head -c -3 | jq . 2>/dev/null || echo "$VISITORS_RESPONSE" | head -c -3
else
    echo -e "${RED}❌ 访问统计查询API失败 (HTTP $VISITORS_HTTP_CODE)${NC}"
    echo "响应内容："
    echo "$VISITORS_RESPONSE" | head -c -3
fi

# 测试获取总人数
echo "测试GET /api/stats/total..."
TOTAL_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8080/api/stats/total)
TOTAL_HTTP_CODE="${TOTAL_RESPONSE: -3}"

if [ "$TOTAL_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 总人数查询API正常${NC}"
    echo "总人数数据："
    echo "$TOTAL_RESPONSE" | head -c -3 | jq . 2>/dev/null || echo "$TOTAL_RESPONSE" | head -c -3
else
    echo -e "${RED}❌ 总人数查询API失败 (HTTP $TOTAL_HTTP_CODE)${NC}"
fi

# 12. 测试前端代理
echo -e "${BLUE}🌐 测试前端代理...${NC}"

if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端API代理正常${NC}"
else
    echo -e "${RED}❌ 前端API代理失败${NC}"
    echo "检查Nginx配置："
    nginx -t
fi

# 13. 验证数据库表创建
echo -e "${BLUE}📋 验证数据库表创建...${NC}"
TABLE_EXISTS_AFTER=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES LIKE 'visitor_records';" 2>/dev/null | grep visitor_records || true)
if [ -n "$TABLE_EXISTS_AFTER" ]; then
    echo -e "${GREEN}✅ visitor_records表已创建${NC}"
    # 显示表中的数据
    RECORD_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT COUNT(*) FROM visitor_records;" 2>/dev/null | tail -n 1)
    echo "表中记录数: $RECORD_COUNT"
else
    echo -e "${YELLOW}⚠️ visitor_records表仍未创建${NC}"
fi

echo ""
echo -e "${GREEN}🎉 500错误修复完成！${NC}"
echo ""
echo -e "${BLUE}📋 如果问题仍然存在，请检查：${NC}"
echo "1. 后端日志：journalctl -u togo-backend -f"
echo "2. 数据库连接：mysql -u$DB_USER -p$DB_PASSWORD -h$DB_HOST -e 'USE $DB_NAME; SHOW TABLES;'"
echo "3. 环境配置：cat /opt/togo/.env"
echo "4. 服务状态：systemctl status togo-backend"
echo ""
echo -e "${BLUE}📍 测试访问：http://101.126.6.243${NC}"