import type { Tool, ToolCategory } from '../types';

// 工具分类
export const categories: ToolCategory[] = [
  { id: 'media', name: '媒体处理', color: '#722ed1' },
  { id: 'development', name: '开发工具', color: '#1890ff' },
  { id: 'text', name: '文本处理', color: '#52c41a' },
  { id: 'utility', name: '实用工具', color: '#fa8c16' },
];

// 工具列表
export const tools: Tool[] = [
  // 媒体处理类
  {
    id: 'video-to-gif',
    name: '视频转GIF',
    description: '将视频文件转换为GIF动图，支持自定义参数',
    category: categories[0],
    icon: 'VideoCameraOutlined',
    path: '/tools/video-to-gif',
    implemented: true,
  },
  {
    id: 'image-compress',
    name: '图片压缩',
    description: '压缩图片大小，保持质量的同时减少文件体积',
    category: categories[0],
    icon: 'FileImageOutlined',
    path: '/tools/image-compress',
    implemented: false,
  },
  {
    id: 'image-convert',
    name: '图片格式转换',
    description: '支持JPG、PNG、WebP等多种格式互转',
    category: categories[0],
    icon: 'SwapOutlined',
    path: '/tools/image-convert',
    implemented: false,
  },
  
  // 开发工具类
  {
    id: 'json-formatter',
    name: 'JSON格式化',
    description: '美化和压缩JSON数据，支持语法高亮',
    category: categories[1],
    icon: 'CodeOutlined',
    path: '/tools/json-formatter',
    implemented: true,
  },
  {
    id: 'base64-encode',
    name: 'Base64编解码',
    description: 'Base64编码和解码工具',
    category: categories[1],
    icon: 'LockOutlined',
    path: '/tools/base64-encode',
    implemented: true,
  },
  {
    id: 'url-encode',
    name: 'URL编解码',
    description: 'URL编码和解码处理',
    category: categories[1],
    icon: 'LinkOutlined',
    path: '/tools/url-encode',
    implemented: true,
  },
  
  // 文本处理类
  {
    id: 'markdown-preview',
    name: 'Markdown预览',
    description: '实时预览Markdown文档效果',
    category: categories[2],
    icon: 'FileMarkdownOutlined',
    path: '/tools/markdown-preview',
    implemented: true,
  },
  {
    id: 'regex-test',
    name: '正则表达式测试',
    description: '测试和调试正则表达式',
    category: categories[2],
    icon: 'BugOutlined',
    path: '/tools/regex-test',
    implemented: true,
  },
  
  // 实用工具类
  {
    id: 'timestamp-convert',
    name: '时间戳转换',
    description: '时间戳与日期时间的相互转换',
    category: categories[3],
    icon: 'ClockCircleOutlined',
    path: '/tools/timestamp-convert',
    implemented: true,
  },
  {
    id: 'qr-code-generator',
    name: '二维码生成',
    description: '生成自定义二维码',
    category: categories[3],
    icon: 'QrcodeOutlined',
    path: '/tools/qr-code-generator',
    implemented: true,
  },
  {
    id: 'color-tool',
    name: '颜色工具',
    description: '颜色格式转换和调色板工具',
    category: categories[1],
    icon: 'BgColorsOutlined',
    path: '/tools/color-tool',
    implemented: true,
  },
  {
    id: 'password-generator',
    name: '密码生成器',
    description: '生成安全的随机密码',
    category: categories[3],
    icon: 'SafetyOutlined',
    path: '/tools/password-generator',
    implemented: true,
  },
  {
    id: 'system-monitor',
    name: '系统监控',
    description: '监控服务器资源使用情况和文件存储',
    category: categories[1],
    icon: 'MonitorOutlined',
    path: '/tools/system-monitor',
    implemented: true,
  },
];
