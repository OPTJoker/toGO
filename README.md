# toGO - 开发者工具箱

一个集成了多种开发常用工具的现代化Web应用，采用前后端分离架构设计，为开发者提供便捷的在线工具集合。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go Version](https://img.shields.io/badge/go-1.24+-blue.svg)
![React Version](https://img.shields.io/badge/react-19+-blue.svg)

## ✨ 功能特性

### 🎬 媒体处理
- **视频转GIF** - 将视频文件转换为GIF动图，支持自定义参数和质量设置

### � 开发工具
- **JSON格式化** - 美化和压缩JSON数据，支持语法高亮和错误检测
- **Base64编解码** - Base64编码和解码工具，支持文本和文件
- **URL编解码** - URL编码和解码处理，支持批量处理
- **颜色工具** - 颜色格式转换(HEX/RGB/HSL)和调色板工具

### � 文本处理
- **Markdown预览** - 实时预览Markdown文档效果，支持GitHub风格
- **正则表达式测试** - 测试和调试正则表达式，提供常用模式

### 🛠️ 实用工具
- **时间戳转换** - 时间戳与日期时间的相互转换，支持多种格式
- **二维码生成** - 生成自定义二维码，支持多种尺寸和容错率
- **密码生成器** - 生成安全的随机密码，可自定义长度和复杂度

### 🚀 规划中功能
- 🖼️ **图片压缩** - 压缩图片大小，保持质量
- 🔄 **图片格式转换** - 支持多种图片格式互转
- 📊 **Hash计算** - MD5/SHA1/SHA256等哈希值计算
- 🌐 **IP查询** - IP地址归属地查询
- 📋 **代码格式化** - 多语言代码格式化工具

## 🛠️ 技术栈

### 前端技术
- ⚡ **Vite** - 现代化构建工具，极速开发体验
- ⚛️ **React 19** - 最新的React框架
- 🟦 **TypeScript** - 类型安全的JavaScript超集
- 🎨 **Ant Design** - 企业级UI组件库
- 🚦 **React Router** - 声明式路由管理
- 📡 **Axios** - 基于Promise的HTTP客户端

### 后端技术
- 🐹 **Go 1.24+** - 高性能的后端语言
- 🌿 **Gin** - 轻量级Web框架
- 🎬 **FFmpeg** - 强大的多媒体处理工具
- 🔄 **CORS** - 跨域资源共享支持

### 部署技术
- 🐳 **Docker** - 容器化部署
- 🔧 **Docker Compose** - 多容器编排
- 🌐 **Nginx** - 静态资源服务和反向代理

## 📁 项目结构

```
toGO/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   │   └── Layout.tsx   # 布局组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── Home.tsx    # 首页
│   │   │   ├── VideoToGif.tsx
│   │   │   ├── JsonFormatter.tsx
│   │   │   ├── Base64Encode.tsx
│   │   │   ├── UrlEncode.tsx
│   │   │   ├── MarkdownPreview.tsx
│   │   │   ├── RegexTest.tsx
│   │   │   ├── TimestampConvert.tsx
│   │   │   ├── QrCodeGenerator.tsx
│   │   │   ├── ColorTool.tsx
│   │   │   └── PasswordGenerator.tsx
│   │   ├── api/            # API接口
│   │   ├── data/           # 工具配置数据
│   │   ├── types/          # TypeScript类型定义
│   │   └── App.tsx         # 应用入口
│   ├── public/             # 静态资源
│   ├── package.json        # 依赖配置
│   ├── vite.config.ts      # Vite配置
│   ├── Dockerfile          # Docker配置
│   └── nginx.conf          # Nginx配置
├── backend/                 # 后端项目
│   ├── internal/           # 内部包
│   │   ├── handlers/       # 路由处理器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具函数
│   ├── uploads/            # 上传文件目录
│   ├── output/             # 输出文件目录
│   ├── main.go            # 主程序入口
│   ├── go.mod             # Go模块配置
│   └── Dockerfile         # Docker配置
├── docker-compose.yml      # Docker编排配置
├── test_api.sh            # API测试脚本
├── test_gif.sh            # GIF转换测试脚本
└── README.md              # 项目文档
```

## 🚀 快速开始

### 📋 前置要求
- **Node.js** >= 18.0
- **Go** >= 1.24
- **FFmpeg** (用于视频处理功能)
- **Docker** & **Docker Compose** (可选，用于容器化部署)

### 💻 本地开发

#### 1. 安装FFmpeg
```bash
# macOS (使用Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install epel-release
sudo yum install ffmpeg

# Windows
# 从 https://ffmpeg.org/download.html 下载并添加到PATH
```

#### 2. 克隆项目
```bash
git clone https://github.com/OPTJoker/toGO.git
cd toGO
```

#### 3. 启动后端服务
```bash
# 进入后端目录
cd backend

# 安装Go依赖
go mod tidy

# 启动开发服务器
go run main.go

# 服务将在 http://localhost:8080 启动
```

#### 4. 启动前端服务
```bash
# 新开终端，进入前端目录
cd frontend

# 安装npm依赖
npm install

# 启动开发服务器
npm run dev

# 前端将在 http://localhost:5173 启动
```

#### 5. 访问应用
打开浏览器访问 `http://localhost:5173` 即可使用应用。

### 🐳 Docker部署

#### 一键部署（推荐）
```bash
# 克隆项目
git clone https://github.com/OPTJoker/toGO.git
cd toGO

# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 分别构建
```bash
# 构建后端镜像
cd backend
docker build -t togo-backend .

# 构建前端镜像
cd ../frontend
docker build -t togo-frontend .

# 运行后端容器
docker run -d -p 8080:8080 \
  -v $(pwd)/../backend/uploads:/root/uploads \
  -v $(pwd)/../backend/output:/root/output \
  --name togo-backend togo-backend

# 运行前端容器
docker run -d -p 3000:80 \
  --link togo-backend:backend \
  --name togo-frontend togo-frontend
```

#### 停止和清理
```bash
# 停止所有服务
docker-compose down

# 停止并删除所有数据
docker-compose down -v

# 清理镜像
docker-compose down --rmi all
```

### 🌐 生产环境部署

#### 使用Nginx反向代理
```nginx
# /etc/nginx/sites-available/togo
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态文件服务
    location /static/ {
        proxy_pass http://localhost:8080;
    }
}
```

#### 使用PM2管理后端进程
```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'togo-backend',
    script: 'go',
    args: 'run main.go',
    cwd: './backend',
    env: {
      PORT: 8080,
      GIN_MODE: 'release'
    }
  }]
}
EOF

# 启动服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 开机自启
pm2 startup
```

## 📖 API接口文档

### 视频转GIF
**接口**: `POST /api/video/to-gif`

**请求**:
```bash
curl -X POST \
  http://localhost:8080/api/video/to-gif \
  -H 'Content-Type: multipart/form-data' \
  -F 'video=@example.mp4' \
  -F 'startTime=0' \
  -F 'duration=3' \
  -F 'width=480' \
  -F 'quality=medium'
```

**参数说明**:
- `video`: 视频文件 (必需)
- `startTime`: 开始时间(秒) (可选，默认0)
- `duration`: 持续时间(秒) (可选，默认3)
- `width`: 输出宽度(像素) (可选，默认480)
- `quality`: 质量等级 `high`/`medium`/`low` (可选，默认medium)

**响应示例**:
```json
{
  "code": 200,
  "message": "转换成功",
  "data": {
    "gifUrl": "/static/1755242176.gif",
    "fileSize": 1024000,
    "duration": 3.0,
    "width": 480,
    "height": 270
  }
}
```

### 健康检查
**接口**: `GET /api/health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T10:30:00Z"
}
```

## 🏗️ 架构设计

### 前端架构
- **组件化设计**: 基于React函数组件和Hooks
- **类型安全**: 完整的TypeScript类型定义
- **路由管理**: React Router实现单页应用导航
- **状态管理**: 使用React内置状态管理
- **UI一致性**: 基于Ant Design组件库统一设计语言
- **响应式设计**: 支持桌面和移动端设备

### 后端架构
- **RESTful API**: 符合REST规范的API设计
- **分层架构**: handlers(控制层) -> utils(工具层)
- **中间件支持**: CORS、请求日志、错误恢复
- **文件处理**: 安全的文件上传和多媒体处理
- **错误处理**: 统一的错误响应格式

### 部署架构
- **容器化**: Docker镜像支持一键部署
- **服务编排**: Docker Compose管理多服务
- **负载均衡**: 支持Nginx反向代理
- **静态资源**: 优化的静态文件服务

## 🔧 开发指南

### 添加新工具

#### 1. 前端开发
```typescript
// 1. 在 frontend/src/data/tools.ts 添加工具配置
{
  id: 'new-tool',
  name: '新工具',
  description: '工具描述',
  category: categories[1], // 选择合适的分类
  icon: 'ToolOutlined',
  path: '/tools/new-tool',
  implemented: true,
}

// 2. 创建页面组件 frontend/src/pages/NewTool.tsx
import React from 'react';

const NewTool: React.FC = () => {
  return (
    <div>
      {/* 工具实现 */}
    </div>
  );
};

export default NewTool;

// 在 App.tsx 中添加路由配置
```

#### 2. 后端开发（如需要）
```go
// 1. 在 backend/internal/handlers/ 创建处理器
package handlers

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func NewToolHandler(c *gin.Context) {
    // 处理逻辑
    c.JSON(http.StatusOK, gin.H{
        "code": 200,
        "message": "success",
        "data": nil,
    })
}

// 2. 在 main.go 中注册路由
r.POST("/api/new-tool", handlers.NewToolHandler)
```

### 代码规范

#### 前端规范
- 使用TypeScript严格模式
- 组件名使用PascalCase
- 文件名使用PascalCase (组件) 或 camelCase (工具)
- 使用ESLint和Prettier格式化代码

#### 后端规范
- 遵循Go官方代码规范
- 使用`gofmt`格式化代码
- 函数名使用camelCase，导出函数使用PascalCase
- 错误处理要完整

### 测试

#### 前端测试
```bash
cd frontend
npm run test
```

#### 后端测试
```bash
cd backend
go test ./...
```

#### API测试
```bash
# 使用提供的测试脚本
./test_api.sh
./test_gif.sh
```

## 🤝 贡献指南

### 提交代码
1. Fork本项目
2. 创建特性分支: `git checkout -b feature/new-tool`
3. 提交更改: `git commit -am 'Add new tool'`
4. 推送分支: `git push origin feature/new-tool`
5. 提交Pull Request

### 报告问题
- 使用GitHub Issues报告bug
- 提供详细的错误信息和复现步骤
- 包含系统环境信息

### 功能建议
- 通过GitHub Issues提交功能建议
- 描述使用场景和预期效果
- 提供设计思路或参考

## 📝 更新日志

### v1.0.0 (2025-01-18)
#### 新增功能
- ✨ 视频转GIF功能
- ✨ JSON格式化工具
- ✨ Base64编解码工具
- ✨ URL编解码工具
- ✨ Markdown预览工具
- ✨ 正则表达式测试工具
- ✨ 时间戳转换工具
- ✨ 二维码生成工具
- ✨ 颜色工具
- ✨ 密码生成器

#### 技术特性
- 🐳 Docker容器化部署
- 🔄 前后端分离架构
- 📱 响应式设计
- 🛡️ TypeScript类型安全
- 🎨 Ant Design UI组件

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [React](https://react.dev/) - 前端框架
- [Go](https://golang.org/) - 后端语言
- [Ant Design](https://ant.design/) - UI组件库
- [Vite](https://vitejs.dev/) - 构建工具
- [Gin](https://gin-gonic.com/) - Go Web框架
- [FFmpeg](https://ffmpeg.org/) - 多媒体处理

## 📞 联系方式

- 项目地址: [https://github.com/OPTJoker/toGO](https://github.com/OPTJoker/toGO)
- 问题反馈: [GitHub Issues](https://github.com/OPTJoker/toGO/issues)

---

⭐ 如果这个项目对你有帮助，请给一个Star支持一下！
     name: '新工具',
     description: '工具描述',
     category: categories[0],
     icon: 'IconName',
     path: '/tools/new-tool',
     implemented: true,
   }
   ```

2. **创建前端页面**
   ```typescript
   // frontend/src/pages/NewTool.tsx
   export default NewTool;
   ```

3. **添加路由**
   ```typescript
   // frontend/src/App.tsx
   <Route path="/tools/new-tool" element={<NewTool />} />
   ```

4. **实现后端接口**
   ```go
   // backend/internal/handlers/new_tool.go
   func NewToolHandler(c *gin.Context) {
     // 实现逻辑
   }
   ```

## 许可证

不采用任何许可，你随便造

## 联系方式

- 项目地址: [https://github.com/OPTJoker/toGO]
- 问题反馈: [https://github.com/OPTJoker/toGO/issues]

