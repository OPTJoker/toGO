#!/bin/bash
# 修复MySQL密码连接问题的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 修复MySQL密码连接问题...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 检查环境配置文件
echo -e "${BLUE}📋 检查环境配置文件...${NC}"
if [ ! -f "/opt/togo/.env" ]; then
    echo -e "${RED}❌ /opt/togo/.env 文件不存在${NC}"
    if [ -f "backend/.env.production" ]; then
        echo -e "${YELLOW}⚠️ 复制 .env.production 到 /opt/togo/.env${NC}"
        cp backend/.env.production /opt/togo/.env
    else
        echo -e "${RED}❌ 找不到 .env.production 文件${NC}"
        exit 1
    fi
fi

echo "当前环境配置："
cat /opt/togo/.env

# 2. 检查密码配置
echo -e "${BLUE}🔐 检查密码配置...${NC}"
DB_PASSWORD=$(grep "DB_PASSWORD=" /opt/togo/.env | cut -d'=' -f2)

if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "your_mysql_password_here" ]; then
    echo -e "${YELLOW}⚠️ 密码未设置或为默认值，需要更新${NC}"
    echo "请输入MySQL root密码（如果使用install-mysql.sh安装，密码是root123456）："
    read -s mysql_password
    
    if [ -z "$mysql_password" ]; then
        echo -e "${RED}❌ 密码不能为空${NC}"
        exit 1
    fi
    
    # 更新密码
    if grep -q "DB_PASSWORD=" /opt/togo/.env; then
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$mysql_password/g" /opt/togo/.env
    else
        echo "DB_PASSWORD=$mysql_password" >> /opt/togo/.env
    fi
    
    echo -e "${GREEN}✅ 密码已更新${NC}"
else
    echo -e "${GREEN}✅ 密码已配置: $DB_PASSWORD${NC}"
fi

# 3. 测试MySQL连接
echo -e "${BLUE}🔍 测试MySQL连接...${NC}"
DB_USER=$(grep "DB_USER=" /opt/togo/.env | cut -d'=' -f2 || echo "root")
DB_PASSWORD=$(grep "DB_PASSWORD=" /opt/togo/.env | cut -d'=' -f2)
DB_HOST=$(grep "DB_HOST=" /opt/togo/.env | cut -d'=' -f2 || echo "localhost")
DB_PORT=$(grep "DB_PORT=" /opt/togo/.env | cut -d'=' -f2 || echo "3306")
DB_NAME=$(grep "DB_NAME=" /opt/togo/.env | cut -d'=' -f2 || echo "toGO")

echo "测试连接参数："
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"

if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ MySQL连接测试成功${NC}"
else
    echo -e "${RED}❌ MySQL连接测试失败${NC}"
    echo "请检查："
    echo "1. MySQL服务是否运行: systemctl status mysql"
    echo "2. 密码是否正确"
    echo "3. 手动测试: mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p"
    exit 1
fi

# 4. 检查并创建数据库
echo -e "${BLUE}🗄️ 检查数据库...${NC}"
DB_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep $DB_NAME || true)

if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️ 数据库 $DB_NAME 不存在，正在创建...${NC}"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || {
        echo -e "${RED}❌ 数据库创建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 数据库 $DB_NAME 已创建${NC}"
else
    echo -e "${GREEN}✅ 数据库 $DB_NAME 已存在${NC}"
fi

# 5. 设置正确的文件权限
echo -e "${BLUE}🔐 设置文件权限...${NC}"
chown togo:togo /opt/togo/.env
chmod 600 /opt/togo/.env

# 6. 重启后端服务
echo -e "${BLUE}🔄 重启后端服务...${NC}"
systemctl restart togo-backend

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 8

# 7. 检查服务状态
if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    echo "服务状态："
    systemctl status togo-backend --no-pager -l
    echo ""
    echo "最新日志："
    journalctl -u togo-backend --no-pager -n 10
    exit 1
fi

# 8. 检查数据库连接日志
echo -e "${BLUE}📋 检查数据库连接日志...${NC}"
sleep 2

if journalctl -u togo-backend --no-pager -n 10 | grep -i "database connected" >/dev/null; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
elif journalctl -u togo-backend --no-pager -n 10 | grep -i "database initialization failed" >/dev/null; then
    echo -e "${RED}❌ 数据库初始化仍然失败${NC}"
    echo "错误日志："
    journalctl -u togo-backend --no-pager -n 10 | grep -i "database"
    exit 1
else
    echo -e "${YELLOW}⚠️ 未找到明确的数据库连接日志${NC}"
    echo "最新日志："
    journalctl -u togo-backend --no-pager -n 5
fi

# 9. 测试访问统计API
echo -e "${BLUE}🧪 测试访问统计API...${NC}"
sleep 3

RECORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:8080/api/stats/record 2>/dev/null)
RECORD_CODE="${RECORD_RESPONSE: -3}"

if [ "$RECORD_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问统计API正常 (HTTP $RECORD_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
else
    echo -e "${RED}❌ 访问统计API仍然失败 (HTTP $RECORD_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
fi

echo ""
echo -e "${GREEN}🎉 MySQL密码修复完成！${NC}"
echo ""
echo -e "${BLUE}📍 现在可以测试访问：http://101.126.6.243${NC}"
echo -e "${BLUE}📊 访问统计功能应该正常工作${NC}"
echo ""
echo -e "${BLUE}📋 如果问题仍然存在：${NC}"
echo "1. 查看实时日志: journalctl -u togo-backend -f"
echo "2. 检查环境配置: cat /opt/togo/.env"
echo "3. 手动测试数据库: mysql -u$DB_USER -p$DB_PASSWORD -e 'USE $DB_NAME; SELECT 1;'"