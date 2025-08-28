#!/bin/bash
# 修复数据库连接问题的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 修复数据库连接问题...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 检查MySQL服务
echo -e "${BLUE}🔍 检查MySQL服务...${NC}"
if ! systemctl is-active --quiet mysql; then
    echo -e "${YELLOW}⚠️ MySQL服务未运行，正在启动...${NC}"
    systemctl start mysql
    systemctl enable mysql
    sleep 3
fi

if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL服务运行正常${NC}"
else
    echo -e "${RED}❌ MySQL服务启动失败${NC}"
    exit 1
fi

# 2. 检查环境配置文件
echo -e "${BLUE}📋 检查环境配置...${NC}"
if [ ! -f "/opt/togo/.env" ]; then
    echo -e "${RED}❌ 环境配置文件不存在${NC}"
    exit 1
fi

# 显示当前配置
echo "当前数据库配置："
grep "DB_" /opt/togo/.env

# 3. 检查数据库是否存在
echo -e "${BLUE}🗄️ 检查数据库...${NC}"
DB_NAME=$(grep "DB_NAME=" /opt/togo/.env | cut -d'=' -f2)
DB_EXISTS=$(mysql -uroot -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep $DB_NAME || true)

if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️ 数据库 $DB_NAME 不存在，正在创建...${NC}"
    echo "请输入MySQL root密码："
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
        echo -e "${RED}❌ 数据库创建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 数据库 $DB_NAME 已创建${NC}"
else
    echo -e "${GREEN}✅ 数据库 $DB_NAME 已存在${NC}"
fi

# 4. 测试数据库连接
echo -e "${BLUE}🔍 测试数据库连接...${NC}"
DB_USER=$(grep "DB_USER=" /opt/togo/.env | cut -d'=' -f2)
DB_PASSWORD=$(grep "DB_PASSWORD=" /opt/togo/.env | cut -d'=' -f2)
DB_HOST=$(grep "DB_HOST=" /opt/togo/.env | cut -d'=' -f2)
DB_PORT=$(grep "DB_PORT=" /opt/togo/.env | cut -d'=' -f2)

# 检查密码是否为默认值
if [ "$DB_PASSWORD" = "your_mysql_password_here" ]; then
    echo -e "${YELLOW}⚠️ 检测到默认密码，需要更新${NC}"
    echo "请输入实际的MySQL root密码："
    read -s mysql_password
    sed -i "s/DB_PASSWORD=your_mysql_password_here/DB_PASSWORD=$mysql_password/g" /opt/togo/.env
    DB_PASSWORD=$mysql_password
    echo -e "${GREEN}✅ 密码已更新${NC}"
fi

# 测试连接
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
    echo "手动测试命令："
    echo "  mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p -e 'USE $DB_NAME; SELECT 1;'"
    exit 1
fi

# 5. 重启后端服务
echo -e "${BLUE}🔄 重启后端服务...${NC}"
systemctl restart togo-backend

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 8

# 6. 检查服务状态
if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    echo "服务状态："
    systemctl status togo-backend --no-pager -l
    echo ""
    echo "服务日志："
    journalctl -u togo-backend --no-pager -n 20
    exit 1
fi

# 7. 检查数据库连接日志
echo -e "${BLUE}📋 检查数据库连接日志...${NC}"
if journalctl -u togo-backend --no-pager -n 10 | grep -i "database connected" >/dev/null; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
elif journalctl -u togo-backend --no-pager -n 10 | grep -i "database initialization failed" >/dev/null; then
    echo -e "${RED}❌ 数据库初始化失败${NC}"
    echo "错误日志："
    journalctl -u togo-backend --no-pager -n 10 | grep -i "database"
    exit 1
else
    echo -e "${YELLOW}⚠️ 未找到数据库连接日志${NC}"
fi

# 8. 测试访问统计API
echo -e "${BLUE}🧪 测试访问统计API...${NC}"
sleep 3

# 测试记录访问
RECORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:8080/api/stats/record 2>/dev/null)
RECORD_CODE="${RECORD_RESPONSE: -3}"

if [ "$RECORD_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问记录API正常 (HTTP $RECORD_CODE)${NC}"
else
    echo -e "${RED}❌ 访问记录API失败 (HTTP $RECORD_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
    echo ""
    echo "后端日志："
    journalctl -u togo-backend --no-pager -n 5
fi

# 测试获取统计
VISITORS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8080/api/stats/visitors 2>/dev/null)
VISITORS_CODE="${VISITORS_RESPONSE: -3}"

if [ "$VISITORS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问统计查询API正常 (HTTP $VISITORS_CODE)${NC}"
    echo "统计数据："
    echo "$VISITORS_RESPONSE" | head -c -3 | jq . 2>/dev/null || echo "$VISITORS_RESPONSE" | head -c -3
else
    echo -e "${RED}❌ 访问统计查询API失败 (HTTP $VISITORS_CODE)${NC}"
fi

# 9. 验证数据库表
echo -e "${BLUE}📊 验证数据库表...${NC}"
TABLE_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES LIKE 'visitor_records';" 2>/dev/null | grep visitor_records || true)
if [ -n "$TABLE_EXISTS" ]; then
    echo -e "${GREEN}✅ visitor_records表已创建${NC}"
    RECORD_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT COUNT(*) FROM visitor_records;" 2>/dev/null | tail -n 1)
    echo "表中记录数: $RECORD_COUNT"
else
    echo -e "${YELLOW}⚠️ visitor_records表未创建，可能是数据库连接问题${NC}"
fi

echo ""
echo -e "${GREEN}🎉 数据库连接修复完成！${NC}"
echo ""
echo -e "${BLUE}📍 现在可以测试访问：http://101.126.6.243${NC}"
echo -e "${BLUE}📊 访问统计功能应该正常工作${NC}"