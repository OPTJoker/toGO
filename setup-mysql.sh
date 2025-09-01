#!/bin/bash

# MySQL权限配置脚本
# 用于解决 "Host '127.0.0.1' is not allowed to connect to this MySQL server" 问题

echo "🔧 MySQL权限配置脚本"
echo "================================"

# 检查MySQL是否运行
if ! systemctl is-active --quiet mysql; then
    echo "❌ MySQL服务未运行，正在启动..."
    sudo systemctl start mysql
    sleep 3
fi

echo "📋 当前MySQL用户权限："
mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='root';"

echo ""
echo "🔧 配置MySQL权限..."
echo "请输入MySQL root密码："

# 创建MySQL配置脚本
cat > /tmp/mysql_setup.sql << 'EOF'
-- 为root用户添加localhost和127.0.0.1的访问权限
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root123456';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY 'root123456';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root123456';

-- 授予所有权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- 创建toGO数据库
CREATE DATABASE IF NOT EXISTS toGO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示当前用户
SELECT user, host FROM mysql.user WHERE user='root';
EOF

# 执行MySQL配置
mysql -u root -p < /tmp/mysql_setup.sql

if [ $? -eq 0 ]; then
    echo "✅ MySQL权限配置成功！"
    echo ""
    echo "📊 验证配置："
    mysql -u root -p -e "SELECT user, host FROM mysql.user WHERE user='root';"
    
    echo ""
    echo "🧪 测试连接："
    mysql -u root -p -h localhost -e "SELECT 'localhost连接成功' as status;"
    mysql -u root -p -h 127.0.0.1 -e "SELECT '127.0.0.1连接成功' as status;"
    
    echo ""
    echo "✅ 配置完成！现在可以重启后端服务测试数据库连接。"
else
    echo "❌ MySQL权限配置失败，请检查MySQL服务状态和root密码。"
fi

# 清理临时文件
rm -f /tmp/mysql_setup.sql

echo ""
echo "💡 如果仍有问题，请尝试以下命令："
echo "   sudo systemctl restart mysql"
echo "   ./manage-ubuntu.sh restart"