import axios from 'axios';
import type { 
  ApiResponse, 
  VideoToGifRequest, 
  VideoToGifResponse, 
  ConversionHistoryItem,
  CompressionResponse,
  DecompressionResponse
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

  // 获取转换历史记录
  getHistory: async (): Promise<ConversionHistoryItem[]> => {
    try {
      const response: ApiResponse<ConversionHistoryItem[]> = await api.get('/video/history');
      // 确保返回数组，提供健壮性
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('API返回的历史记录格式异常:', response.data);
        return [];
      }
    } catch (error) {
      console.error('获取历史记录API调用失败:', error);
      // 返回空数组而不是抛出错误，避免页面崩溃
      return [];
    }
  },

  // 删除转换历史记录
  deleteHistory: async (id: string): Promise<void> => {
    await api.delete(`/video/history/${id}`);
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

export default api;
