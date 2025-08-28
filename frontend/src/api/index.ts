import axios from 'axios';
import type { 
  ApiResponse, 
  VideoToGifRequest, 
  VideoToGifResponse, 
  CompressionResponse,
  DecompressionResponse,
  VisitorStats
} from '../types';
import { API_CONFIG } from '../config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 视频转GIF API
export const videoToGifApi = {
  convert: async (request: VideoToGifRequest): Promise<VideoToGifResponse> => {
    const formData = new FormData();
    formData.append('video', request.file);
    
    if (request.startTime !== undefined) {
      formData.append('startTime', request.startTime.toString());
    }
    if (request.duration !== undefined) {
      formData.append('duration', request.duration.toString());
    }
    if (request.width !== undefined) {
      formData.append('width', request.width.toString());
    }
    if (request.quality) {
      formData.append('quality', request.quality);
    }

    const response: ApiResponse<VideoToGifResponse> = await api.post('/video/to-gif', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

// 文件压缩 API
export const compressionApi = {
  // 压缩文件
  compressFile: async (filename: string): Promise<CompressionResponse> => {
    const response: ApiResponse<CompressionResponse> = await api.post(`/compress/file/${filename}`);
    return response.data;
  },

  // 解压文件
  decompressFile: async (filename: string): Promise<DecompressionResponse> => {
    const response: ApiResponse<DecompressionResponse> = await api.post(`/compress/decompress/${filename}`);
    return response.data;
  },
};

// 二维码生成 API
export const qrcodeApi = {
  // 生成二维码（POST方式，返回base64数据）
  generateQRCode: async (request: {
    text: string;
    size?: number;
    level?: string;
    color?: string;
    bgColor?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: string;
  }> => {
    return await api.post('/qrcode/generate', request);
  },

  // 获取二维码图片URL（GET方式）
  getQRCodeImageUrl: (text: string, size?: number, level?: string): string => {
    const params = new URLSearchParams({
      text,
      ...(size && { size: size.toString() }),
      ...(level && { level }),
    });
    return `${API_CONFIG.BASE_URL}/qrcode/image?${params.toString()}`;
  },
};

// 访问统计 API
export const statsApi = {
  // 记录访问者
  recordVisitor: async (): Promise<void> => {
    await api.post('/stats/record');
  },

  // 获取访问统计
  getVisitorStats: async (): Promise<VisitorStats> => {
    const response: ApiResponse<VisitorStats> = await api.get('/stats/visitors');
    return response.data;
  },

  // 获取总访问人数
  getTotalVisitors: async (): Promise<number> => {
    const response: ApiResponse<{totalVisitors: number}> = await api.get('/stats/total');
    return response.data.totalVisitors;
  },
};

export default api;
