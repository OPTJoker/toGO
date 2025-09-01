#!/bin/bash

# API 404错误排查脚本
# 用于诊断toGO项目的API问题

echo "=== toGO API 问题排查脚本 ==="
echo "开始时间: $(date)"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. 检查项目结构
echo "=== 1. 检查项目结构 ==="
if [ -d "backend" ] && [ -d "frontend" ]; then
    log_success "项目结构正常"
else
    log_error "项目结构异常，缺少backend或frontend目录"
    exit 1
fi

# 2. 检查后端服务状态
echo ""
echo "=== 2. 检查后端服务状态 ==="
BACKEND_PORT=8080
if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
    log_success "后端服务正在运行 (端口 $BACKEND_PORT)"
    BACKEND_PID=$(lsof -ti :$BACKEND_PORT)
    log_info "后端进程ID: $BACKEND_PID"
else
    log_error "后端服务未运行 (端口 $BACKEND_PORT)"
    echo "尝试启动后端服务..."
    cd backend
    if [ -f "main.go" ]; then
        log_info "启动后端服务..."
        nohup go run main.go > ../backend.log 2>&1 &
        sleep 3
        if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
            log_success "后端服务启动成功"
        else
            log_error "后端服务启动失败，请检查 backend.log"
        fi
    else
        log_error "未找到 main.go 文件"
    fi
    cd ..
fi

# 3. 检查MySQL数据库状态
echo ""
echo "=== 3. 检查MySQL数据库状态 ==="
if command -v mysql > /dev/null 2>&1; then
    log_info "MySQL客户端已安装"
    
    # 检查MySQL服务是否运行
    if pgrep -x "mysqld" > /dev/null; then
        log_success "MySQL服务正在运行"
    else
        log_warning "MySQL服务未运行"
        echo "尝试启动MySQL服务..."
        if command -v brew > /dev/null 2>&1; then
            brew services start mysql
        elif command -v systemctl > /dev/null 2>&1; then
            sudo systemctl start mysql
        else
            log_warning "无法自动启动MySQL，请手动启动"
        fi
    fi
    
    # 测试数据库连接
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_NAME=${DB_NAME:-toGO}
    
    log_info "测试数据库连接..."
    if mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p -e "SELECT 1;" > /dev/null 2>&1; then
        log_success "数据库连接正常"
        
        # 检查数据库是否存在
        if mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p -e "USE $DB_NAME;" > /dev/null 2>&1; then
            log_success "数据库 $DB_NAME 存在"
        else
            log_warning "数据库 $DB_NAME 不存在，尝试创建..."
            mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
            if [ $? -eq 0 ]; then
                log_success "数据库 $DB_NAME 创建成功"
            else
                log_error "数据库 $DB_NAME 创建失败"
            fi
        fi
    else
        log_error "数据库连接失败"
        log_info "请检查数据库配置: HOST=$DB_HOST, PORT=$DB_PORT, USER=$DB_USER"
    fi
else
    log_warning "MySQL客户端未安装"
fi

# 4. 测试API端点
echo ""
echo "=== 4. 测试API端点 ==="
BASE_URL="http://localhost:8080"

# 测试基础健康检查
log_info "测试基础健康检查..."
if curl -s "$BASE_URL/" > /dev/null; then
    log_success "基础端点响应正常"
else
    log_error "基础端点无响应"
fi

# 测试API健康检查
log_info "测试API健康检查..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    log_success "API健康检查响应正常"
    echo "响应内容: $HEALTH_RESPONSE"
else
    log_error "API健康检查失败"
fi

# 测试统计API（可能出问题的端点）
log_info "测试统计API..."
STATS_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/api/stats/total" 2>/dev/null)
HTTP_CODE="${STATS_RESPONSE: -3}"
RESPONSE_BODY="${STATS_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    log_success "统计API响应正常"
    echo "响应内容: $RESPONSE_BODY"
elif [ "$HTTP_CODE" = "500" ]; then
    log_error "统计API返回500错误（数据库问题）"
    echo "响应内容: $RESPONSE_BODY"
else
    log_error "统计API返回错误码: $HTTP_CODE"
    echo "响应内容: $RESPONSE_BODY"
fi

# 5. 检查前端服务状态
echo ""
echo "=== 5. 检查前端服务状态 ==="
FRONTEND_PORT=5173
if lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
    log_success "前端服务正在运行 (端口 $FRONTEND_PORT)"
else
    log_warning "前端服务未运行 (端口 $FRONTEND_PORT)"
    echo "前端通常在开发时需要手动启动: cd frontend && npm run dev"
fi

# 6. 检查环境变量
echo ""
echo "=== 6. 检查环境变量 ==="
log_info "后端环境变量:"
echo "  PORT: ${PORT:-8080}"
echo "  ENVIRONMENT: ${ENVIRONMENT:-production}"
echo "  DB_HOST: ${DB_HOST:-localhost}"
echo "  DB_PORT: ${DB_PORT:-3306}"
echo "  DB_USER: ${DB_USER:-root}"
echo "  DB_PASSWORD: ${DB_PASSWORD:-[未设置]}"
echo "  DB_NAME: ${DB_NAME:-toGO}"

# 7. 检查日志文件
echo ""
echo "=== 7. 检查日志文件 ==="
if [ -f "backend.log" ]; then
    log_info "后端日志文件存在，最近10行:"
    tail -10 backend.log
else
    log_warning "后端日志文件不存在"
fi

# 8. 网络连通性测试
echo ""
echo "=== 8. 网络连通性测试 ==="
log_info "测试本地网络连通性..."
if ping -c 1 localhost > /dev/null 2>&1; then
    log_success "localhost 连通正常"
else
    log_error "localhost 连通异常"
fi

# 9. 端口占用情况
echo ""
echo "=== 9. 端口占用情况 ==="
log_info "检查相关端口占用:"
echo "端口 8080 (后端):"
lsof -i :8080 || echo "  未被占用"
echo "端口 5173 (前端):"
lsof -i :5173 || echo "  未被占用"
echo "端口 3306 (MySQL):"
lsof -i :3306 || echo "  未被占用"

# 10. 生成修复建议
echo ""
echo "=== 10. 修复建议 ==="
echo "根据上述检查结果，可能的解决方案:"
echo ""
echo "1. 如果后端服务未运行:"
echo "   cd backend && go run main.go"
echo ""
echo "2. 如果MySQL未运行:"
echo "   # macOS (Homebrew):"
echo "   brew services start mysql"
echo "   # Linux:"
echo "   sudo systemctl start mysql"
echo ""
echo "3. 如果数据库连接失败:"
echo "   # 检查数据库配置"
echo "   export DB_HOST=localhost"
echo "   export DB_PORT=3306"
echo "   export DB_USER=root"
echo "   export DB_PASSWORD=your_password"
echo "   export DB_NAME=toGO"
echo ""
echo "4. 如果需要创建数据库:"
echo "   mysql -u root -p -e \"CREATE DATABASE toGO;\""
echo ""
echo "5. 如果前端需要启动:"
echo "   cd frontend && npm install && npm run dev"

echo ""
echo "=== 排查完成 ==="
echo "结束时间: $(date)"