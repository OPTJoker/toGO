#!/bin/bash
# 修复访问统计404错误的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 修复访问统计404错误...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 检查数据库配置
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

# 2. 更新环境变量配置
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

# 3. 检查MySQL密码配置
echo -e "${BLUE}🔐 检查MySQL密码配置...${NC}"

# 提示用户更新MySQL密码
echo -e "${YELLOW}请确保/opt/togo/.env文件中的MySQL密码正确${NC}"
echo "当前配置文件内容："
grep "DB_" /opt/togo/.env

echo ""
echo -e "${YELLOW}如果密码不正确，请手动编辑：${NC}"
echo "  nano /opt/togo/.env"
echo "  修改 DB_PASSWORD=your_actual_mysql_password"

# 4. 重启后端服务
echo -e "${BLUE}🔄 重启后端服务...${NC}"
systemctl restart togo-backend

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 5

# 5. 检查服务状态
echo -e "${BLUE}🔍 检查服务状态...${NC}"
if systemctl is-active --quiet togo-backend; then
    echo -e "${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "${RED}❌ 后端服务异常${NC}"
    echo "查看服务日志："
    journalctl -u togo-backend --no-pager -n 20
    exit 1
fi

# 6. 测试API连接
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

# 7. 测试访问统计API
echo -e "${BLUE}📊 测试访问统计API...${NC}"

# 测试记录访问
if curl -f -X POST http://localhost:8080/api/stats/record > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 访问统计记录API正常${NC}"
else
    echo -e "${RED}❌ 访问统计记录API失败${NC}"
    echo "可能的原因："
    echo "1. 数据库连接失败"
    echo "2. 数据库密码错误"
    echo "3. 数据库权限问题"
fi

# 测试获取统计
if curl -f http://localhost:8080/api/stats/visitors > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 访问统计查询API正常${NC}"
else
    echo -e "${YELLOW}⚠️ 访问统计查询API可能需要数据${NC}"
fi

# 8. 测试前端代理
echo -e "${BLUE}🌐 测试前端代理...${NC}"

if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端API代理正常${NC}"
else
    echo -e "${RED}❌ 前端API代理失败${NC}"
    echo "检查Nginx配置："
    nginx -t
fi

echo ""
echo -e "${GREEN}🎉 404错误修复完成！${NC}"
echo ""
echo -e "${BLUE}📋 如果问题仍然存在，请检查：${NC}"
echo "1. MySQL密码是否正确：nano /opt/togo/.env"
echo "2. 数据库连接：mysql -u root -p -e 'USE toGO; SHOW TABLES;'"
echo "3. 服务日志：journalctl -u togo-backend -f"
echo "4. Nginx状态：systemctl status nginx"
echo ""
echo -e "${BLUE}📍 测试访问：http://101.126.6.243${NC}"