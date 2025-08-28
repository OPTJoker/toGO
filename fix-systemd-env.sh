#!/bin/bash
# 修复systemd服务环境变量配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 修复systemd服务环境变量配置...${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用sudo运行此脚本${NC}"
    exit 1
fi

# 1. 检查当前systemd配置
echo -e "${BLUE}📋 检查当前systemd配置...${NC}"
if [ ! -f "/etc/systemd/system/togo-backend.service" ]; then
    echo -e "${RED}❌ systemd服务文件不存在${NC}"
    exit 1
fi

echo "当前服务配置："
cat /etc/systemd/system/togo-backend.service

# 2. 检查是否缺少DB_PASSWORD环境变量
if ! grep -q "Environment=DB_PASSWORD=" /etc/systemd/system/togo-backend.service; then
    echo -e "${YELLOW}⚠️ 发现缺少DB_PASSWORD环境变量${NC}"
    
    # 获取密码
    if [ -f "/opt/togo/.env" ]; then
        DB_PASSWORD=$(grep "DB_PASSWORD=" /opt/togo/.env | cut -d'=' -f2)
        if [ -n "$DB_PASSWORD" ] && [ "$DB_PASSWORD" != "your_mysql_password_here" ]; then
            echo -e "${GREEN}✅ 从.env文件获取密码: $DB_PASSWORD${NC}"
        else
            echo "请输入MySQL root密码（如果使用install-mysql.sh安装，密码是root123456）："
            read -s DB_PASSWORD
        fi
    else
        echo "请输入MySQL root密码："
        read -s DB_PASSWORD
    fi
    
    # 备份原配置
    cp /etc/systemd/system/togo-backend.service /etc/systemd/system/togo-backend.service.backup
    echo -e "${GREEN}✅ 已备份原配置文件${NC}"
    
    # 在DB_NAME行后添加DB_PASSWORD
    sed -i "/Environment=DB_NAME=/a Environment=DB_PASSWORD=$DB_PASSWORD" /etc/systemd/system/togo-backend.service
    
    echo -e "${GREEN}✅ 已添加DB_PASSWORD环境变量${NC}"
else
    echo -e "${GREEN}✅ DB_PASSWORD环境变量已存在${NC}"
fi

# 3. 显示更新后的配置
echo -e "${BLUE}📋 更新后的服务配置：${NC}"
cat /etc/systemd/system/togo-backend.service

# 4. 重新加载systemd配置
echo -e "${BLUE}🔄 重新加载systemd配置...${NC}"
systemctl daemon-reload

# 5. 重启服务
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
    echo "最新日志："
    journalctl -u togo-backend --no-pager -n 10
    exit 1
fi

# 7. 检查数据库连接日志
echo -e "${BLUE}📋 检查数据库连接日志...${NC}"
sleep 3

if journalctl -u togo-backend --no-pager -n 10 | grep -i "database connected" >/dev/null; then
    echo -e "${GREEN}✅ 数据库连接成功！${NC}"
elif journalctl -u togo-backend --no-pager -n 10 | grep -i "database initialization failed" >/dev/null; then
    echo -e "${RED}❌ 数据库初始化仍然失败${NC}"
    echo "错误日志："
    journalctl -u togo-backend --no-pager -n 10 | grep -i "database"
else
    echo -e "${YELLOW}⚠️ 未找到明确的数据库连接日志${NC}"
    echo "最新日志："
    journalctl -u togo-backend --no-pager -n 5
fi

# 8. 测试访问统计API
echo -e "${BLUE}🧪 测试访问统计API...${NC}"
sleep 3

RECORD_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:8080/api/stats/record 2>/dev/null)
RECORD_CODE="${RECORD_RESPONSE: -3}"

if [ "$RECORD_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 访问统计API正常 (HTTP $RECORD_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
else
    echo -e "${RED}❌ 访问统计API失败 (HTTP $RECORD_CODE)${NC}"
    echo "响应内容："
    echo "$RECORD_RESPONSE" | head -c -3
fi

echo ""
echo -e "${GREEN}🎉 systemd环境变量修复完成！${NC}"
echo ""
echo -e "${BLUE}📍 现在可以测试访问：http://101.126.6.243${NC}"
echo -e "${BLUE}📊 访问统计功能应该正常工作${NC}"