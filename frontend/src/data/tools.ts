import type { Tool, ToolCategory } from '../types';

// 工具分类
export const categories: ToolCategory[] = [
  { id: 'utility', name: '实用工具', color: '#fa8c16' },
  { id: 'development', name: '开发工具', color: '#1890ff' },
  { id: 'text', name: '文本处理', color: '#52c41a' },
];

// 工具列表
export const tools: Tool[] = [
  // 实用工具类
  {
    id: 'video-to-gif',
    name: '视频转GIF',
    description: '将视频文件转换为GIF动图',
    category: categories[0],
    icon: 'VideoCameraOutlined',
    path: '/tools/video-to-gif',
    implemented: true,
  },
  {
    id: 'timestamp-convert',
    name: '时间戳转换',
    description: '时间戳与日期时间的相互转换',
    category: categories[0],
    icon: 'ClockCircleOutlined',
    path: '/tools/timestamp-convert',
    implemented: true,
  },
  {
    id: 'qr-code-generator',
    name: '二维码生成',
    description: '生成自定义二维码',
    category: categories[0],
    icon: 'QrcodeOutlined',
    path: '/tools/qr-code-generator',
    implemented: true,
  },
  
  // 开发工具类
  {
    id: 'json-formatter',
    name: 'JSON工具',
    description: 'JSON校验、格式化',
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
  {
    id: 'color-tool',
    name: '颜色工具',
    description: '颜色格式转换和调色板工具',
    category: categories[1],
    icon: 'BgColorsOutlined',
    path: '/tools/color-tool',
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
];
