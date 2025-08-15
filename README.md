# 开发者工具箱

一个集成了多种开发常用工具的Web应用，采用前后端分离架构。

## 功能特性

### 已实现功能
- 🎬 **视频转GIF** - 将视频文件转换为GIF动图，支持自定义参数

### 规划中功能
- 🖼️ **图片压缩** - 压缩图片大小，保持质量
- 🔄 **图片格式转换** - 支持多种图片格式互转
- 📝 **JSON格式化** - 美化和压缩JSON数据
- 🔐 **Base64编解码** - Base64编码和解码工具
- 🔗 **URL编解码** - URL编码和解码处理
- 📄 **Markdown预览** - 实时预览Markdown文档
- 🐛 **正则表达式测试** - 测试和调试正则表达式
- ⏰ **时间戳转换** - 时间戳与日期时间互转
- 📱 **二维码生成** - 生成自定义二维码

## 技术栈

### 前端
- ⚡ **Vite** - 构建工具
- ⚛️ **React 18** - UI框架
- 🟦 **TypeScript** - 类型安全
- 🎨 **Ant Design** - UI组件库
- 🚦 **React Router** - 路由管理
- 📡 **Axios** - HTTP客户端

### 后端
- 🐹 **Go** - 后端语言
- 🌿 **Gin** - Web框架
- 🎬 **FFmpeg** - 媒体处理

## 项目结构

```
toGif/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── api/            # API接口
│   │   ├── data/           # 数据配置
│   │   ├── types/          # TypeScript类型
│   │   └── App.tsx         # 应用入口
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # 后端项目
│   ├── internal/
│   │   ├── handlers/       # 路由处理器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具函数
│   ├── main.go             # 应用入口
│   ├── go.mod
│   └── Dockerfile
├── docker-compose.yml        # Docker编排
└── README.md
```

## 快速开始

### 前置要求
- Node.js >= 18
- Go >= 1.21
- FFmpeg (用于视频处理)

### 本地开发

#### 安装FFmpeg
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# 下载FFmpeg并添加到PATH
```

#### 启动后端
```bash
cd backend
go mod tidy
go run main.go
```

#### 启动前端
```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173 查看应用。

### Docker部署

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build
```

访问 http://localhost:3000 查看应用。

## API接口

### 视频转GIF
```
POST /api/video/to-gif
Content-Type: multipart/form-data

参数:
- video: 视频文件 (必需)
- startTime: 开始时间(秒) (可选，默认0)
- duration: 持续时间(秒) (可选，默认3)
- width: 输出宽度(像素) (可选，默认480)
- quality: 质量 high/medium/low (可选，默认medium)

响应:
{
  "code": 200,
  "message": "转换成功",
  "data": {
    "gifUrl": "/static/xxx.gif",
    "fileSize": 1024000,
    "duration": 3.0
  }
}
```

## 架构设计

### 前端架构
- **组件化设计**: 使用React函数组件和Hooks
- **类型安全**: 完整的TypeScript类型定义
- **路由管理**: React Router实现单页应用
- **状态管理**: 使用React内置状态管理
- **UI一致性**: 基于Ant Design组件库

### 后端架构
- **RESTful API**: 符合REST规范的API设计
- **分层架构**: handlers -> services -> utils
- **中间件**: CORS、日志、错误恢复
- **文件处理**: 安全的文件上传和处理

### 可扩展性设计
- **功能分类**: 按类别组织工具，便于扩展
- **模块化**: 每个工具独立实现，互不影响
- **配置驱动**: 工具列表通过配置文件管理
- **插件化**: 后续可扩展为插件化架构

## 开发指南

### 添加新工具

1. **更新工具配置**
   ```typescript
   // frontend/src/data/tools.ts
   {
     id: 'new-tool',
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

