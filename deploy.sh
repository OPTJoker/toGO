#!/bin/bash

# toGO 生产环境部署脚本
# 针对 4核8G + 40GB SSD + 4Mbps 带宽优化

set -e

echo "🚀 开始部署 toGO 工具网站..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查系统资源
check_system() {
    echo "📊 检查系统资源..."
    
    # 检查内存
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ $TOTAL_MEM -lt 7000 ]; then
        echo -e "${YELLOW}警告: 系统内存少于8GB，当前: ${TOTAL_MEM}MB${NC}"
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo -e "${RED}错误: 磁盘使用率超过80%，当前: ${DISK_USAGE}%${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 系统资源检查通过${NC}"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装必要依赖..."
    
    # 更新包列表
    sudo apt update
    
    # 安装基础工具
    sudo apt install -y curl wget git vim htop
    
    # 安装Docker（如果未安装）
    if ! command -v docker &> /dev/null; then
        echo "安装 Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi
    
    # 安装Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "安装 Docker Compose..."
        sudo apt install -y docker-compose-plugin
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 系统优化
optimize_system() {
    echo "⚡ 系统优化配置..."
    
    # 设置交换分区（如果内存不足）
    if [ ! -f /swapfile ]; then
        echo "创建2GB交换分区..."
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # 优化内核参数
    sudo tee -a /etc/sysctl.conf << EOF
# toGO 优化配置
vm.swappiness=10
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.ipv4.tcp_rmem=4096 16384 16777216
net.ipv4.tcp_wmem=4096 16384 16777216
EOF
    
    sudo sysctl -p
    
    echo -e "${GREEN}✅ 系统优化完成${NC}"
}

# 部署应用
deploy_app() {
    echo "🐳 部署应用..."
    
    # 更新项目代码
    git pull origin main
    
    # 停止旧容器
    docker-compose down
    
    # 清理旧镜像
    docker system prune -f
    
    # 构建并启动
    docker-compose up --build -d
    
    echo -e "${GREEN}✅ 应用部署完成${NC}"
}

# 设置定时任务
setup_cron() {
    echo "⏰ 设置定时任务..."
    
    # 每天凌晨2点清理Docker系统
    (crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && docker system prune -f") | crontab -
    
    # 每周日凌晨3点重启应用
    (crontab -l 2>/dev/null; echo "0 3 * * 0 cd $(pwd) && docker-compose restart") | crontab -
    
    echo -e "${GREEN}✅ 定时任务设置完成${NC}"
}

# 创建监控脚本
create_monitoring() {
    echo "📊 创建监控脚本..."
    
    cat > monitor.sh << 'EOF'
#!/bin/bash

# toGO 监控脚本

echo "=== toGO 系统监控 $(date) ==="

# 检查容器状态
echo "📦 容器状态:"
docker-compose ps

# 检查资源使用
echo "💾 内存使用:"
free -h

echo "💿 磁盘使用:"
df -h /

echo "🔄 CPU负载:"
uptime

# 检查应用状态
echo "🌐 应用状态:"
curl -s http://localhost:8080/api/health-simple | head -1

# 检查文件大小
echo "📁 存储使用:"
du -sh backend/uploads backend/output 2>/dev/null || echo "目录不存在"

echo "================================"
EOF
    
    chmod +x monitor.sh
    
    echo -e "${GREEN}✅ 监控脚本创建完成${NC}"
}

# 主函数
main() {
    echo "🔧 toGO 生产环境部署工具"
    echo "适配配置: 4核8G + 40GB SSD + 4Mbps"
    echo ""
    
    check_system
    install_dependencies
    optimize_system
    deploy_app
    setup_cron
    create_monitoring
    
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo ""
    echo "📌 访问地址:"
    echo "   前端: http://localhost:3000"
    echo "   后端: http://localhost:8080"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   重启服务: docker-compose restart"
    echo "   停止服务: docker-compose down"
    echo "   系统监控: ./monitor.sh"
    echo ""
    echo "⚠️  注意事项:"
    echo "   - 定期运行 ./monitor.sh 检查系统状态"
    echo "   - 文件会自动清理，无需手动管理"
    echo "   - 上传文件限制50MB以适配带宽"
    echo ""
}

# 执行主函数
main "$@"
