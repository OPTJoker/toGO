#!/bin/bash
# MySQL安装和配置脚本 - 增强版

set -e

echo "🗄️ 安装和配置MySQL..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 清理可能存在的MySQL残留
echo "🧹 清理MySQL残留文件..."
systemctl stop mysql mysqld mariadb 2>/dev/null || true
apt remove --purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-* -y 2>/dev/null || true
apt autoremove -y 2>/dev/null || true
rm -rf /var/lib/mysql /etc/mysql /var/log/mysql 2>/dev/null || true

# 更新包列表
echo "📦 更新包列表..."
apt update

# 预配置MySQL安装
echo "🔧 预配置MySQL..."
echo "mysql-server mysql-server/root_password password root123456" | debconf-set-selections
echo "mysql-server mysql-server/root_password_again password root123456" | debconf-set-selections

# 安装MySQL服务器
echo "📦 安装MySQL服务器..."
DEBIAN_FRONTEND=noninteractive apt install -y mysql-server mysql-client

# 检查MySQL是否安装成功
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL安装失败"
    exit 1
fi

# 初始化MySQL数据目录
echo "🔧 初始化MySQL..."
if [ ! -d "/var/lib/mysql/mysql" ]; then
    mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
fi

# 确保MySQL目录权限正确
chown -R mysql:mysql /var/lib/mysql
chmod 750 /var/lib/mysql

# 创建MySQL配置文件
echo "⚙️ 配置MySQL..."
cat > /etc/mysql/mysql.conf.d/custom.cnf << EOF
[mysqld]
bind-address = 127.0.0.1
port = 3306
datadir = /var/lib/mysql
socket = /var/run/mysqld/mysqld.sock
pid-file = /var/run/mysqld/mysqld.pid
log-error = /var/log/mysql/error.log

# 安全设置
skip-name-resolve
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO

# 性能设置
innodb_buffer_pool_size = 128M
max_connections = 100
EOF

# 确保MySQL socket目录存在
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld

# 启动MySQL服务
echo "🚀 启动MySQL服务..."
systemctl daemon-reload
systemctl enable mysql

# 尝试启动MySQL，如果失败则进行故障排除
if ! systemctl start mysql; then
    echo "❌ MySQL启动失败，进行故障排除..."
    
    # 检查端口占用
    echo "检查端口3306占用情况："
    netstat -tlnp | grep :3306 || echo "端口3306未被占用"
    
    # 检查MySQL错误日志
    echo "检查MySQL错误日志："
    if [ -f /var/log/mysql/error.log ]; then
        tail -20 /var/log/mysql/error.log
    fi
    
    # 尝试手动启动MySQL
    echo "尝试手动启动MySQL..."
    sudo -u mysql mysqld --skip-grant-tables --skip-networking &
    MYSQL_PID=$!
    sleep 5
    
    # 杀死手动启动的MySQL
    kill $MYSQL_PID 2>/dev/null || true
    sleep 2
    
    # 再次尝试启动服务
    systemctl start mysql || {
        echo "❌ MySQL服务仍然无法启动"
        echo "请查看详细错误信息："
        echo "systemctl status mysql"
        echo "journalctl -xeu mysql"
        exit 1
    }
fi

# 等待MySQL启动
echo "⏳ 等待MySQL启动..."
for i in {1..30}; do
    if systemctl is-active --quiet mysql; then
        echo "✅ MySQL服务启动成功"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MySQL服务启动超时"
        systemctl status mysql
        exit 1
    fi
    sleep 1
done

# 等待MySQL端口可用
echo "⏳ 等待MySQL端口可用..."
for i in {1..30}; do
    if nc -z localhost 3306 2>/dev/null; then
        echo "✅ MySQL端口3306可用"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MySQL端口3306不可用"
        exit 1
    fi
    sleep 1
done

# 安全配置MySQL
echo "🔐 配置MySQL安全设置..."

# 设置root密码
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root123456';" 2>/dev/null || {
    # 如果上面的命令失败，尝试其他方法
    mysql -e "UPDATE mysql.user SET authentication_string=PASSWORD('root123456') WHERE User='root';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true
}

# 使用新密码进行后续配置
mysql -u root -proot123456 -e "DELETE FROM mysql.user WHERE User='';" 2>/dev/null || true
mysql -u root -proot123456 -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" 2>/dev/null || true
mysql -u root -proot123456 -e "DROP DATABASE IF EXISTS test;" 2>/dev/null || true
mysql -u root -proot123456 -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" 2>/dev/null || true
mysql -u root -proot123456 -e "FLUSH PRIVILEGES;" 2>/dev/null || true

# 测试MySQL连接
echo "🔍 测试MySQL连接..."
if mysql -u root -proot123456 -e "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ MySQL连接测试成功"
else
    echo "❌ MySQL连接测试失败"
    exit 1
fi

echo "✅ MySQL安装和配置完成"
echo ""
echo "📋 MySQL信息:"
echo "  用户名: root"
echo "  密码: root123456"
echo "  端口: 3306"
echo "  状态: $(systemctl is-active mysql)"
echo ""
echo "📋 常用命令:"
echo "  连接MySQL: mysql -u root -p"
echo "  查看状态: systemctl status mysql"
echo "  重启服务: systemctl restart mysql"
echo "  查看日志: journalctl -u mysql -f"
echo ""
echo "⚠️  请记住MySQL root密码: root123456"
echo "🔄 现在可以运行部署脚本: sudo ./deploy-native.sh"