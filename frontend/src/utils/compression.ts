// 客户端文件压缩工具
export class ClientCompressionService {
  
  /**
   * 压缩文件为 Gzip 格式
   */
  static async compressFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async function(e) {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // 使用CompressionStream API压缩
          const compressionStream = new CompressionStream('gzip');
          const compressedStream = new Response(uint8Array).body?.pipeThrough(compressionStream);
          
          if (!compressedStream) {
            throw new Error('压缩流创建失败');
          }
          
          const compressedArrayBuffer = await new Response(compressedStream).arrayBuffer();
          
          // 创建压缩后的文件
          const compressedFile = new File(
            [compressedArrayBuffer],
            file.name + '.gz',
            { type: 'application/gzip' }
          );
          
          console.log(`文件压缩完成: ${file.size} -> ${compressedFile.size} (压缩率: ${(compressedFile.size / file.size * 100).toFixed(1)}%)`);
          resolve(compressedFile);
        } catch (error) {
          console.error('压缩失败:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 检查是否需要压缩（文件大小 >= 8MB）
   */
  static shouldCompress(file: File): boolean {
    const threshold = 8 * 1024 * 1024; // 8MB
    return file.size >= threshold;
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 计算压缩率
   */
  static getCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return (compressedSize / originalSize) * 100;
  }
}
