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

// API响应类型
export interface ApiResponse<T = any> {
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
}

// 转换历史记录类型
export interface ConversionHistoryItem {
  id: string;
  filename: string;
  gifUrl: string;
  fileSize: number;
  createdAt: string;
}
