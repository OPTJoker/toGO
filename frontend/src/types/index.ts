// 工具类型定义
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  path: string;
  implemented: boolean;
}

export interface ToolCategory {
  id: string;
  name: string;
  color: string;
}

// 系统健康状态接口
export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  uploadsSize: number;
  outputSize: number;
  goroutines: number;
  timestamp: string;
}

// API响应类型
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 视频转GIF相关类型
export interface VideoToGifRequest {
  file: File;
  startTime?: number;
  duration?: number;
  width?: number;
  quality?: 'ultra' | 'high' | 'medium' | 'low';  // 添加 ultra 超高质量
}

export interface VideoToGifResponse {
  gifUrl: string;
  fileSize: number;
  duration: number;
  videoDuration: number;
  zipUrl?: string;           // ZIP压缩包下载链接（仅大文件）
  zipSize?: number;          // ZIP文件大小（仅大文件）
  compressionRatio?: number; // 压缩率（仅大文件）
}

// 文件压缩响应类型
export interface CompressionResponse {
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  savedBytes: number;
}

// 文件解压响应类型
export interface DecompressionResponse {
  decompressedUrl: string;
  filename: string;
}

// 访问统计相关类型
export interface VisitorStats {
  todayVisitors: number;
  date: string;
}