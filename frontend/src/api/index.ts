import axios from 'axios';
import type { ApiResponse, VideoToGifRequest, VideoToGifResponse, ConversionHistoryItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:19988/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时，适合文件上传
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

export default api;
