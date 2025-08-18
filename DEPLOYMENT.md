# 部署配置说明

## 环境变量配置

### 开发环境 (.env.development)
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_STATIC_BASE_URL=http://localhost:8080/static
```

### 生产环境 (.env.production)
```
VITE_API_BASE_URL=/api
VITE_STATIC_BASE_URL=/static
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
