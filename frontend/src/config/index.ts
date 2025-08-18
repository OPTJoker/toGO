/**
 * 应用配置管理
 * 统一管理所有环境变量和配置
 */

// API配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  
  // 静态文件基础URL
  STATIC_BASE_URL: import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:8080/static',
  
  // 请求超时时间
  TIMEOUT: 30000,
} as const;

/**
 * 构建完整的静态资源URL
 * @param path 相对路径，如 '/output/example.gif'
 * @returns 完整的URL
 */
export const buildStaticUrl = (path: string): string => {
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${API_CONFIG.STATIC_BASE_URL}${normalizedPath}`;
};

/**
 * 构建完整的API URL
 * @param path API路径，如 '/video/to-gif'
 * @returns 完整的API URL
 */
export const buildApiUrl = (path: string): string => {
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${API_CONFIG.BASE_URL}${normalizedPath}`;
};

/**
 * 获取当前环境
 */
export const getEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

/**
 * 判断是否为开发环境
 */
export const isDevelopment = () => {
  return getEnvironment() === 'development';
};

/**
 * 判断是否为生产环境
 */
export const isProduction = () => {
  return getEnvironment() === 'production';
};

// 导出配置常量
export default API_CONFIG;
