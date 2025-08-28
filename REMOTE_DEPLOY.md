# 远端部署指南

## 部署到 Ubuntu 服务器 (101.126.6.243)

### 前置条件

1. **服务器环境**：
   - Ubuntu 系统
   - 已安装 MySQL
   - 已安装 Docker 和 Docker Compose

2. **网络配置**：
   - 确保服务器的 80 端口和 8080 端口对外开放
   - 防火墙允许 HTTP 流量

### 部署步骤

#### 1. 准备MySQL数据库

登录服务器，确保MySQL服务运行：
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

创建数据库（可选，部署脚本会自动创建）：
```bash
mysql -u root -p
CREATE DATABASE IF NOT EXISTS togo_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

#### 2. 配置数据库密码

编辑后端生产环境配置文件：
```bash
vim backend/.env.production
```

修改数据库密码：
```
DB_PASSWORD=your_actual_mysql_password
```

#### 3. 执行部署

运行部署脚本：
```bash
./deploy-remote.sh
```


部署脚本会自动：
- 检查Docker和MySQL服务状态
- 创建数据库
- 构建Docker镜像
- 启动所有服务
- 进行健康检查

#### 4. 验证部署

部署完成后，访问以下地址验证：
- 主页：http://101.126.6.243
- API健康检查：http://101.126.6.243/api/health
- 后端API：http://101.126.6.243/api

### 服务管理

#### 查看服务状态
```bash
docker-compose ps
```

#### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

#### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

#### 停止服务
```bash
docker-compose down
```

#### 更新部署
```bash
# 拉取最新代码后重新部署
git pull
./deploy-remote.sh
```


### 架构说明

- **Nginx**: 反向代理，处理静态文件和API路由
- **Frontend**: React应用，运行在容器内的80端口
- **Backend**: Go应用，运行在容器内的8080端口
- **MySQL**: 运行在主机上，通过host.docker.internal访问

### 端口映射

- 80 → Nginx (对外访问)
- 8080 → Backend API
- 3000 → Frontend (内部)
- 3306 → MySQL (主机)

### 故障排除

#### 1. 数据库连接失败
- 检查MySQL服务状态：`sudo systemctl status mysql`
- 检查数据库密码配置
- 确保数据库用户有足够权限

#### 2. 前端无法访问后端API
- 检查nginx配置
- 确认后端服务正常运行
- 检查防火墙设置

#### 3. 容器启动失败
- 查看具体错误：`docker-compose logs [service_name]`
- 检查端口占用：`netstat -tlnp | grep :80`
- 重新构建镜像：`docker-compose build --no-cache`

#### 4. 访问统计功能异常
- 检查数据库连接
- 查看后端日志中的数据库相关错误
- 确认数据库表已正确创建

### 安全建议

1. **数据库安全**：
   - 使用强密码
   - 限制数据库用户权限
   - 定期备份数据

2. **服务器安全**：
   - 配置防火墙
   - 定期更新系统
   - 使用SSL证书（推荐）

3. **应用安全**：
   - 定期更新依赖
   - 监控日志异常
   - 设置资源限制

### 监控和维护

- 定期检查磁盘空间使用情况
- 监控容器资源使用
- 备份重要数据和配置文件
- 设置日志轮转避免日志文件过大