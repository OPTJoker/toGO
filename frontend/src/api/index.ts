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
    
    // 如果是网络错误或500错误，添加更详细的日志
    if (error.response?.status === 500) {
      console.error('服务器内部错误:', error.response.data);
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('网络连接错误');
    }
    
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
  // 记录访问者 - 添加重试机制
  recordVisitor: async (retryCount = 0): Promise<void> => {
    try {
      await api.post('/stats/record');
    } catch (error: any) {
      console.error('记录访问失败:', error);
      
      // 如果是500错误且重试次数少于2次，则重试
      if (error.response?.status === 500 && retryCount < 2) {
        console.log(`重试记录访问 (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
        return statsApi.recordVisitor(retryCount + 1);
      }
      
      // 如果是503服务不可用，直接抛出错误但不重试
      if (error.response?.status === 503) {
        throw new Error('统计服务暂时不可用');
      }
      
      throw error;
    }
  },

  // 获取访问统计
  getVisitorStats: async (): Promise<VisitorStats> => {
    try {
      const response: ApiResponse<VisitorStats> = await api.get('/stats/visitors');
      return response.data;
    } catch (error: any) {
      console.error('获取访问统计失败:', error);
      
      // 如果是503服务不可用，返回默认值
      if (error.response?.status === 503) {
        return {
          todayVisitors: 0,
          date: new Date().toISOString().split('T')[0]
        };
      }
      
      throw error;
    }
  },

  // 获取总访问人数
  getTotalVisitors: async (): Promise<number> => {
    try {
      const response: ApiResponse<{totalVisitors: number}> = await api.get('/stats/total');
      return response.data.totalVisitors;
    } catch (error: any) {
      console.error('获取总访问人数失败:', error);
      
      // 如果是503服务不可用，返回默认值
      if (error.response?.status === 503) {
        return 0;
      }
      
      throw error;
    }
  },
};

export default api;
