#!/bin/bash
# MySQL安装和配置脚本

set -e

echo "🗄️ 安装和配置MySQL..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 更新包列表
echo "📦 更新包列表..."
apt update

# 安装MySQL服务器
echo "📦 安装MySQL服务器..."
DEBIAN_FRONTEND=noninteractive apt install -y mysql-server mysql-client

# 启动MySQL服务
echo "🚀 启动MySQL服务..."
systemctl start mysql
systemctl enable mysql

# 等待MySQL启动
sleep 5

# 检查MySQL服务状态
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL服务启动成功"
else
    echo "❌ MySQL服务启动失败"
    systemctl status mysql
    exit 1
fi

# 安全配置MySQL
echo "🔐 配置MySQL安全设置..."

# 设置root密码和安全配置
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123456';" || true
mysql -u root -proot123456 -e "DELETE FROM mysql.user WHERE User='';" || true
mysql -u root -proot123456 -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" || true
mysql -u root -proot123456 -e "DROP DATABASE IF EXISTS test;" || true
mysql -u root -proot123456 -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" || true
mysql -u root -proot123456 -e "FLUSH PRIVILEGES;" || true

echo "✅ MySQL安装和配置完成"
echo ""
echo "📋 MySQL信息:"
echo "  用户名: root"
echo "  密码: root123456"
echo "  端口: 3306"
echo ""
echo "📋 常用命令:"
echo "  连接MySQL: mysql -u root -p"
echo "  查看状态: systemctl status mysql"
echo "  重启服务: systemctl restart mysql"
echo ""
echo "⚠️  请记住MySQL root密码: root123456"
echo "🔄 现在可以运行部署脚本: sudo ./deploy-native.sh"