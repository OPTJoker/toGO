#!/bin/bash

# toGO Ubuntu 系统管理脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检测系统信息
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$PRETTY_NAME
    else
        OS_NAME="Unknown"
    fi
}

# 显示使用说明
show_usage() {
    detect_system
    echo -e "${BLUE}toGO Ubuntu 服务管理脚本${NC}"
    echo "系统: $OS_NAME"
    echo ""
    echo "用法: $0 {start|stop|restart|status|logs|update|health|clean}"
    echo ""
    echo "命令说明:"
    echo "  start    - 启动所有服务"
    echo "  stop     - 停止所有服务"
    echo "  restart  - 重启所有服务"
    echo "  status   - 查看服务状态"
    echo "  logs     - 查看服务日志"
    echo "  update   - 更新应用代码"
    echo "  health   - 健康检查"
    echo "  clean    - 清理旧文件"
    echo ""
}

# 启动服务
start_services() {
    echo -e "${BLUE}🚀 启动服务...${NC}"
    
    # 启动后端服务
    sudo systemctl start togo-backend
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 后端服务已启动${NC}"
    else
        echo -e "${RED}❌ 后端服务启动失败${NC}"
        return 1
    fi
    
    # 启动Nginx
    sudo systemctl start nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx已启动${NC}"
    else
        echo -e "${RED}❌ Nginx启动失败${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🎉 所有服务启动完成${NC}"
}

# 停止服务
stop_services() {
    echo -e "${BLUE}🛑 停止服务...${NC}"
    
    # 停止后端服务
    sudo systemctl stop togo-backend
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    else
        echo -e "${YELLOW}⚠️ 后端服务停止时出现警告${NC}"
    fi
    
    # 停止Nginx
    sudo systemctl stop nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx已停止${NC}"
    else
        echo -e "${YELLOW}⚠️ Nginx停止时出现警告${NC}"
    fi
    
    echo -e "${GREEN}🎉 所有服务停止完成${NC}"
}

# 重启服务
restart_services() {
    echo -e "${BLUE}🔄 重启服务...${NC}"
    
    # 重启后端服务
    sudo systemctl restart togo-backend
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 后端服务已重启${NC}"
    else
        echo -e "${RED}❌ 后端服务重启失败${NC}"
        return 1
    fi
    
    # 重启Nginx
    sudo systemctl restart nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx已重启${NC}"
    else
        echo -e "${RED}❌ Nginx重启失败${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🎉 所有服务重启完成${NC}"
}

# 查看服务状态
show_status() {
    echo -e "${BLUE}📊 服务状态检查${NC}"
    echo ""
    
    echo -e "${BLUE}=== 后端服务状态 ===${NC}"
    sudo systemctl status togo-backend --no-pager -l
    echo ""
    
    echo -e "${BLUE}=== Nginx状态 ===${NC}"
    sudo systemctl status nginx --no-pager -l
    echo ""
    
    echo -e "${BLUE}=== 端口监听状态 ===${NC}"
    echo "后端端口 8080:"
    ss -tlnp | grep :8080 || echo "端口8080未监听"
    echo "前端端口 80:"
    ss -tlnp | grep :80 || echo "端口80未监听"
    echo ""
    
    echo -e "${BLUE}=== 系统资源 ===${NC}"
    echo "磁盘使用："
    df -h | grep -E "(Filesystem|/dev/)"
    echo ""
    echo "内存使用："
    free -h
    echo ""
    echo "CPU负载："
    uptime
}

# 查看日志
show_logs() {
    echo -e "${BLUE}📋 服务日志${NC}"
    echo ""
    
    case "$2" in
        backend)
            echo -e "${BLUE}=== 后端服务日志 (最新50条) ===${NC}"
            sudo journalctl -u togo-backend --no-pager -n 50
            ;;
        nginx)
            echo -e "${BLUE}=== Nginx日志 (最新50条) ===${NC}"
            sudo journalctl -u nginx --no-pager -n 50
            ;;
        error)
            echo -e "${BLUE}=== 错误日志 ===${NC}"
            sudo journalctl -u togo-backend --no-pager -p err -n 20
            sudo journalctl -u nginx --no-pager -p err -n 20
            ;;
        *)
            echo -e "${BLUE}=== 后端服务日志 (最新30条) ===${NC}"
            sudo journalctl -u togo-backend --no-pager -n 30
            echo ""
            echo -e "${BLUE}=== Nginx日志 (最新20条) ===${NC}"
            sudo journalctl -u nginx --no-pager -n 20
            echo ""
            echo "提示: 使用以下命令查看特定日志："
            echo "  ./manage-ubuntu.sh logs backend  - 后端日志"
            echo "  ./manage-ubuntu.sh logs nginx    - Nginx日志"
            echo "  ./manage-ubuntu.sh logs error    - 错误日志"
            ;;
    esac
}

# 更新应用
update_app() {
    echo -e "${BLUE}🔄 更新应用...${NC}"
    
    # 检查Git状态
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ 当前目录不是Git仓库${NC}"
        return 1
    fi
    
    # 拉取最新代码
    echo "拉取最新代码..."
    git pull
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 代码拉取失败${NC}"
        return 1
    fi
    
    # 构建后端
    echo "构建后端..."
    cd backend
    
    # Ubuntu系统Go路径检测
    GO_CMD="go"
    if [ -f "/usr/local/go/bin/go" ]; then
        GO_CMD="/usr/local/go/bin/go"
        export PATH=$PATH:/usr/local/go/bin
    elif command -v go >/dev/null 2>&1; then
        GO_CMD="go"
    else
        echo -e "${RED}❌ 找不到Go命令${NC}"
        cd ..
        return 1
    fi
    
    echo "使用Go: $($GO_CMD version)"
    
    export GOPROXY=https://goproxy.cn,direct
    export GOSUMDB=off
    $GO_CMD mod tidy
    CGO_ENABLED=0 GOOS=linux $GO_CMD build -o main .
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 后端构建失败${NC}"
        cd ..
        return 1
    fi
    cd ..
    
    # 构建前端
    echo "构建前端..."
    cd frontend
    npm config set registry https://registry.npmmirror.com
    npm install
    VITE_API_BASE_URL=http://101.126.6.243/api VITE_STATIC_BASE_URL=http://101.126.6.243/static npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 前端构建失败${NC}"
        cd ..
        return 1
    fi
    cd ..
    
    # 更新前端文件
    echo "更新前端文件..."
    sudo cp -r frontend/dist/* /var/www/togo/
    
    # 重启服务
    echo "重启服务..."
    sudo systemctl restart togo-backend
    sudo systemctl reload nginx
    
    echo -e "${GREEN}🎉 应用更新完成${NC}"
}

# 健康检查
health_check() {
    echo -e "${BLUE}🔍 Ubuntu系统健康检查${NC}"
    echo ""
    
    # 检查服务状态
    echo "检查服务状态..."
    backend_status=$(systemctl is-active togo-backend)
    nginx_status=$(systemctl is-active nginx)
    
    if [ "$backend_status" = "active" ]; then
        echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    else
        echo -e "${RED}❌ 后端服务状态: $backend_status${NC}"
    fi
    
    if [ "$nginx_status" = "active" ]; then
        echo -e "${GREEN}✅ Nginx运行正常${NC}"
    else
        echo -e "${RED}❌ Nginx状态: $nginx_status${NC}"
    fi
    
    # 检查端口（使用ss命令，Ubuntu 24.04兼容）
    echo ""
    echo "检查端口状态..."
    if ss -tlnp | grep :8080 >/dev/null; then
        echo -e "${GREEN}✅ 后端端口8080正常${NC}"
    else
        echo -e "${RED}❌ 后端端口8080未监听${NC}"
    fi
    
    if ss -tlnp | grep :80 >/dev/null; then
        echo -e "${GREEN}✅ 前端端口80正常${NC}"
    else
        echo -e "${RED}❌ 前端端口80未监听${NC}"
    fi
    
    # 检查API响应
    echo ""
    echo "检查API响应..."
    if curl -f -s http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端API响应正常${NC}"
    else
        echo -e "${RED}❌ 后端API无响应${NC}"
    fi
    
    if curl -f -s http://localhost/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端代理响应正常${NC}"
    else
        echo -e "${RED}❌ 前端代理无响应${NC}"
    fi
    
    # 检查前端页面
    if curl -f -s http://localhost >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端页面响应正常${NC}"
    else
        echo -e "${RED}❌ 前端页面无响应${NC}"
    fi
    
    # 检查磁盘空间
    echo ""
    echo "检查系统资源..."
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        echo -e "${GREEN}✅ 磁盘空间充足 (${disk_usage}% 使用)${NC}"
    elif [ "$disk_usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠️ 磁盘空间不足 (${disk_usage}% 使用)${NC}"
    else
        echo -e "${RED}❌ 磁盘空间严重不足 (${disk_usage}% 使用)${NC}"
    fi
    
    # 检查内存使用
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    memory_percent=${memory_usage%.*}
    if [ "$memory_percent" -lt 80 ]; then
        echo -e "${GREEN}✅ 内存使用正常 (${memory_usage}% 使用)${NC}"
    elif [ "$memory_percent" -lt 90 ]; then
        echo -e "${YELLOW}⚠️ 内存使用较高 (${memory_usage}% 使用)${NC}"
    else
        echo -e "${RED}❌ 内存使用过高 (${memory_usage}% 使用)${NC}"
    fi
    
    # 检查文件权限
    echo ""
    echo "检查文件权限..."
    if [ -w "backend/uploads" ]; then
        echo -e "${GREEN}✅ 上传目录权限正常${NC}"
    else
        echo -e "${RED}❌ 上传目录权限异常${NC}"
    fi
    
    if [ -w "backend/output" ]; then
        echo -e "${GREEN}✅ 输出目录权限正常${NC}"
    else
        echo -e "${RED}❌ 输出目录权限异常${NC}"
    fi
}

# 清理功能
clean_files() {
    echo -e "${BLUE}🧹 清理旧文件...${NC}"
    
    # 清理7天前的文件
    echo "清理7天前的上传文件..."
    find backend/uploads/ -type f -mtime +7 -delete 2>/dev/null || echo "清理上传文件完成"
    
    echo "清理7天前的输出文件..."
    find backend/output/ -type f -mtime +7 -delete 2>/dev/null || echo "清理输出文件完成"
    
    # 清理系统日志
    echo "清理旧的系统日志..."
    sudo journalctl --vacuum-time=7d
    
    echo -e "${GREEN}✅ 文件清理完成${NC}"
}

# 主函数
main() {
    case "$1" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$@"
            ;;
        update)
            update_app
            ;;
        health)
            health_check
            ;;
        clean)
            clean_files
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# 检查是否有参数
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

main "$@"
