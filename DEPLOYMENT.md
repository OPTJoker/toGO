# toGO 云服务器部署指南

## 🚀 一键部署（推荐）

### 方式1：本地构建部署（不依赖Docker Hub）

```bash
# 1. 上传代码到云服务器
scp -r toGO/ root@101.126.6.243:/root/

# 2. 登录云服务器
ssh root@101.126.6.243

# 3. 进入项目目录
cd /root/toGO

# 4. 运行部署脚本
./deploy-native.sh
```

这个脚本会自动：
- 安装所有必需的依赖（Go、Node.js、Nginx、FFmpeg）
- 构建前端和后端应用
- 配置Nginx反向代理
- 创建系统服务
- 启动所有服务

## 📋 部署完成后的管理

### 服务管理命令

```bash
# 启动服务
./manage.sh start

# 停止服务
./manage.sh stop

# 重启服务
./manage.sh restart

# 查看服务状态
./manage.sh status

# 查看日志
./manage.sh logs

# 更新应用（拉取新代码并重新部署）
./manage.sh update
```

### 手动服务管理

```bash
# 后端服务
sudo systemctl start togo-backend     # 启动
sudo systemctl stop togo-backend      # 停止
sudo systemctl restart togo-backend   # 重启
sudo systemctl status togo-backend    # 状态
sudo journalctl -u togo-backend -f    # 实时日志

# Nginx服务
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

## 🔧 重要文件位置

- **后端服务文件**: `/etc/systemd/system/togo-backend.service`
- **Nginx配置**: `/etc/nginx/sites-available/togo`
- **前端文件**: `/var/www/togo/`
- **后端程序**: `./backend/main`
- **日志位置**: `sudo journalctl -u togo-backend`

## 🌐 访问地址

部署完成后，通过以下地址访问：
- **主站**: http://101.126.6.243
- **API健康检查**: http://101.126.6.243/api/health

## 🐛 故障排查

### 1. 服务无法启动

```bash
# 查看后端服务日志
sudo journalctl -u togo-backend --no-pager -n 50

# 查看Nginx日志
sudo journalctl -u nginx --no-pager -n 50

# 检查端口占用
sudo netstat -tlnp | grep :8080
sudo netstat -tlnp | grep :80
```

### 2. 前端无法访问

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 测试Nginx配置
sudo nginx -t

# 重新加载Nginx配置
sudo systemctl reload nginx
```

### 3. API无法访问

```bash
# 检查后端服务
curl http://localhost:8080/api/health

# 检查代理转发
curl http://localhost/api/health
```

### 4. 更新代码

```bash
# 拉取最新代码
git pull

# 重新构建并部署
./manage.sh update
```

## 📁 文件结构说明

```
/root/toGO/
├── deploy-native.sh    # 一键部署脚本
├── manage.sh          # 服务管理脚本
├── backend/           # 后端源码
│   └── main           # 编译后的后端程序
├── frontend/          # 前端源码
│   └── dist/          # 构建后的前端文件
└── ...
```

## ⚙️ 环境变量

后端服务使用的环境变量：
- `GIN_MODE=release`
- `PORT=8080`
- `BASE_URL=http://101.126.6.243`
- `STATIC_BASE_URL=http://101.126.6.243/static`

## 🔒 安全建议

1. **防火墙配置**：
```bash
# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw enable
```

2. **定期备份**：
```bash
# 备份上传的文件
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz backend/uploads/

# 备份配置文件
cp /etc/nginx/sites-available/togo ~/nginx-backup.conf
```

3. **日志轮转**：
```bash
# 查看日志大小
sudo journalctl --disk-usage

# 清理旧日志
sudo journalctl --vacuum-time=7d
```

## 📈 性能监控

```bash
# 查看系统资源使用
htop

# 查看磁盘使用
df -h

# 查看服务内存使用
ps aux | grep main
```

## 云服务部署配置

### 1. Docker部署
在docker-compose.yml中设置环境变量：
```yaml
frontend:
  environment:
    - VITE_API_BASE_URL=/api
    - VITE_STATIC_BASE_URL=/static
```

### 2. Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态文件代理
    location /static {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 云服务商特定配置

#### 阿里云/腾讯云等
```bash
# 设置环境变量
export VITE_API_BASE_URL=https://your-api-domain.com/api
export VITE_STATIC_BASE_URL=https://your-api-domain.com/static

# 构建
npm run build
```

#### Vercel部署
在vercel.json中：
```json
{
  "build": {
    "env": {
      "VITE_API_BASE_URL": "https://your-backend.vercel.app/api",
      "VITE_STATIC_BASE_URL": "https://your-backend.vercel.app/static"
    }
  }
}
```

#### Netlify部署
在netlify.toml中：
```toml
[build.environment]
  VITE_API_BASE_URL = "https://your-backend.netlify.app/api"
  VITE_STATIC_BASE_URL = "https://your-backend.netlify.app/static"
```

## 注意事项

1. **CORS配置**: 确保后端的CORS配置包含生产环境的域名
2. **HTTPS**: 生产环境建议使用HTTPS
3. **CDN**: 静态资源可以配置CDN加速
4. **环境变量**: 不要在代码中硬编码任何URL或配置

## 验证部署

部署后可以通过以下方式验证：
1. 检查浏览器开发者工具的Network面板，确认API请求的URL正确
2. 测试文件上传和下载功能
3. 检查静态资源是否正确加载
