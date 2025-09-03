import React, { useState, useRef } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Form, 
  InputNumber, 
  Select, 
  Row, 
  Col, 
  Typography,
  Space, 
  Progress,
  Image,
  Divider,
  message
} from 'antd';
import { 
  InboxOutlined, 
  PlayCircleOutlined, 
  DownloadOutlined,
  CompressOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { videoToGifApi } from '../api';
import type { VideoToGifRequest } from '../types';
import { ClientCompressionService } from '../utils/compression';
import { buildStaticUrl } from '../config';

const { Paragraph } = Typography;
const { Dragger } = Upload;

interface ConvertForm {
  startTime: number;
  duration: number;
  width: number;
  quality: 'ultra' | 'high' | 'medium' | 'low';  // 添加 ultra 超高质量
}

const VideoToGif: React.FC = () => {
  const [form] = Form.useForm<ConvertForm>();
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [gifResult, setGifResult] = useState<{
    url: string; 
    size: number; 
    duration: number; 
    videoDuration: number;
    zipUrl?: string;
    zipSize?: number;
    compressionRatio?: number;
  } | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
  const [isUploading, setIsUploading] = useState(false); // 上传状态
  const videoRef = useRef<HTMLVideoElement>(null);

  const uploadProps: UploadProps = {
    name: 'video',
    multiple: false,
    accept: 'video/*',
    beforeUpload: async (file) => {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error('只能上传视频文件！');
        return false;
      }
      
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('视频文件大小不能超过 50MB！请压缩后上传');
        return false;
      }

      // 检查是否需要压缩（>= 8MB）
      let fileToProcess = file;
      if (ClientCompressionService.shouldCompress(file)) {
        try {
          setIsUploading(true);
          setUploadProgress(20);
          message.info('文件较大，正在自动压缩...');
          
          const compressedFile = await ClientCompressionService.compressFile(file);
          // 创建新的File对象以兼容上传组件
          fileToProcess = new File([compressedFile], compressedFile.name, {
            type: compressedFile.type,
            lastModified: Date.now()
          }) as any;
          setUploadProgress(60);
          
          message.success(`压缩完成！文件大小从 ${ClientCompressionService.formatFileSize(file.size)} 减少到 ${ClientCompressionService.formatFileSize(fileToProcess.size)}`);
        } catch (error) {
          console.error('压缩失败:', error);
          message.warning('自动压缩失败，将使用原文件上传');
          fileToProcess = file;
        } finally {
          setUploadProgress(100);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 1000);
        }
      }

      setVideoFile(fileToProcess);
      
      // 创建预览（使用原文件）
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      
      // 重置结果
      setGifResult(null);
      
      // 获取视频时长
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);
        // 更新表单中的持续时间
        form.setFieldsValue({
          duration: duration
        });
      };
      video.src = url;
      
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setVideoFile(null);
      setVideoPreview('');
      setGifResult(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    },
    fileList: videoFile ? [{
      uid: '1',
      name: videoFile.name,
      status: 'done',
    }] as UploadFile[] : [],
  };

  const handleConvert = async (values: ConvertForm) => {
    if (!videoFile) {
      message.error('请先上传视频文件');
      return;
    }

    setConverting(true);
    setProgress(0);

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    try {
      const request: VideoToGifRequest = {
        file: videoFile,
        startTime: values.startTime,
        duration: values.duration,
        width: values.width,
        quality: values.quality,
      };

      const result = await videoToGifApi.convert(request);
      
      setProgress(100);
      setGifResult({
        url: result.gifUrl,
        size: result.fileSize,
        duration: result.duration,
        videoDuration: result.videoDuration,
        zipUrl: result.zipUrl,
        zipSize: result.zipSize,
        compressionRatio: result.compressionRatio,
      });
      
      message.success('转换成功！');
    } catch (error: unknown) {
      console.error('转换失败:', error);
      
      let errorMessage = '转换失败，请重试';
      
      if (error instanceof Error) {
        // 处理具体的错误类型
        if (error.message.includes('413')) {
          errorMessage = '文件太大，请选择较小的视频文件';
        } else if (error.message.includes('500')) {
          errorMessage = '服务器内部错误，请检查视频文件格式';
        } else {
          errorMessage = `错误: ${error.message}`;
        }
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            data?: { message?: string } 
          };
          request?: any;
        };
        
        if (axiosError.response) {
          // 服务器返回错误响应
          console.error('Error response:', axiosError.response.data);
          if (axiosError.response.data?.message) {
            errorMessage = `转换失败: ${axiosError.response.data.message}`;
          } else if (axiosError.response.status === 500) {
            errorMessage = '服务器内部错误，请检查视频文件格式';
          } else if (axiosError.response.status === 413) {
            errorMessage = '文件太大，请选择较小的视频文件';
          }
        } else if (axiosError.request) {
          // 网络错误
          console.error('Network error:', axiosError.request);
          errorMessage = '网络连接失败，请检查网络连接或确保后端服务正在运行';
        }
      }
      
      alert(errorMessage);
    } finally {
      clearInterval(progressInterval);
      setConverting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 手动压缩文件
  const handleDownloadZip = async () => {
    if (gifResult && gifResult.zipUrl) {
      try {
        // 使用配置工具构建完整的下载URL
        const downloadUrl = buildStaticUrl(gifResult.zipUrl);
        
        // 直接打开下载链接
        window.open(downloadUrl, '_blank');
        message.success('ZIP文件下载开始');
      } catch (error) {
        console.error('下载失败:', error);
        message.error('下载失败，请重试');
      }
    }
  };

  const handleDownload = async () => {
    if (gifResult) {
      try {
        // 使用配置工具构建完整的下载URL
        const downloadUrl = buildStaticUrl(gifResult.url);
        
        // 使用fetch获取二进制数据
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'converted.gif';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        window.URL.revokeObjectURL(url);
        message.success('下载成功');
      } catch (error) {
        console.error('下载失败:', error);
        message.error('下载失败，请重试');
      }
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 64px)',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '24px 16px',
      margin: '0',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      {/* 主要内容区域 */}
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="上传视频" style={{ marginBottom: '24px' }}>
            <Dragger {...uploadProps} style={{ marginBottom: '16px' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽视频文件到此区域上传</p>
              <div className="ant-upload-hint">
                <p style={{ margin: '4px 0' }}>支持格式：MP4、AVI、MOV等常见格式</p>
                <p style={{ margin: '4px 0' }}>文件大小：50MB以内</p>
                <p style={{ margin: '4px 0', color: '#1890ff' }}>
                  <CompressOutlined /> ≥8MB的文件：上传时自动压缩，生成的GIF≥8MB时提供ZIP下载
                </p>
                <p style={{ margin: '4px 0', color: '#52c41a' }}>
                  📁 &lt;8MB的文件：直接上传和下载，无需压缩
                </p>
              </div>
            </Dragger>

            {/* 上传压缩进度 */}
            {isUploading && (
              <Card size="small" style={{ marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Progress percent={uploadProgress} />
                  <p style={{ marginTop: 8, color: '#666' }}>
                    正在处理文件...
                  </p>
                </div>
              </Card>
            )}

            {videoPreview && (
              <div style={{ textAlign: 'center' }}>
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  style={{ width: '100%', maxHeight: '300px' }}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const duration = Math.round(video.duration);
                    // 更新表单中的持续时间
                    form.setFieldsValue({
                      duration: duration
                    });
                  }}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {videoFile && (
            <Card title="转换设置" style={{ marginBottom: '24px' }}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  startTime: 0,
                  duration: 0, // 将使用视频全长
                  width: 1080,
                  quality: 'medium',
                }}
                onFinish={handleConvert}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="开始时间 (秒)"
                      name="startTime"
                      rules={[{ required: true, message: '请输入开始时间' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="持续时间 (秒，0表示使用全部时长)"
                      name="duration"
                      rules={[{ required: true, message: '请输入持续时间' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} placeholder="0表示使用全部时长" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="宽度 (像素)"
                      name="width"
                      rules={[{ required: true, message: '请输入宽度' }]}
                    >
                      <InputNumber min={100} max={3840} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="质量"
                      name="quality"
                      rules={[{ required: true, message: '请选择质量' }]}
                    >
                      <Select>
                        <Select.Option value="ultra">超高质量</Select.Option>
                        <Select.Option value="high">高质量</Select.Option>
                        <Select.Option value="medium">中等质量</Select.Option>
                        <Select.Option value="low">低质量</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={converting}
                    icon={<PlayCircleOutlined />}
                    block
                    size="large"
                  >
                    {converting ? '转换中...' : '开始转换'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}

          {converting && (
            <Card title="转换进度" style={{ marginBottom: '24px' }}>
              <Progress percent={Math.round(progress)} status="active" />
              <Paragraph style={{ textAlign: 'center', marginTop: '16px' }}>
                正在处理视频，请稍候...
              </Paragraph>
            </Card>
          )}

          {gifResult && (
            <Card 
              title="转换结果" 
              extra={
                <Space>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    下载GIF
                  </Button>
                  {gifResult.zipUrl && (
                    <Button 
                      type="primary"
                      icon={<CompressOutlined />}
                      onClick={handleDownloadZip}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                      下载ZIP
                    </Button>
                  )}
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Image
                  src={buildStaticUrl(gifResult.url)}
                  alt="转换后的GIF"
                  style={{ width: '100%' }}
                  preview={{
                    mask: '点击预览',
                  }}
                />
                
                <Divider />
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Paragraph>
                      <strong>文件大小:</strong> {formatFileSize(gifResult.size)}
                    </Paragraph>
                  </Col>
                  <Col span={8}>
                    <Paragraph>
                      <strong>GIF时长:</strong> {gifResult.duration.toFixed(1)}秒
                    </Paragraph>
                  </Col>
                  <Col span={8}>
                    <Paragraph>
                      <strong>原视频时长:</strong> {gifResult.videoDuration?.toFixed(1) || 'N/A'}秒
                    </Paragraph>
                  </Col>
                </Row>

                {/* ZIP压缩包信息显示 - 只有当ZIP存在时才显示 */}
                {gifResult.zipUrl && gifResult.zipSize && gifResult.compressionRatio && (
                  <>
                    <Divider />
                    <Card size="small" title={<><CompressOutlined /> ZIP压缩包</>}>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Paragraph>
                            <strong>ZIP大小:</strong><br/>
                            {formatFileSize(gifResult.zipSize)}
                          </Paragraph>
                        </Col>
                        <Col span={6}>
                          <Paragraph>
                            <strong>压缩率:</strong><br/>
                            {gifResult.compressionRatio.toFixed(1)}%
                          </Paragraph>
                        </Col>
                        <Col span={6}>
                          <Paragraph>
                            <strong>节省空间:</strong><br/>
                            {formatFileSize(gifResult.size - gifResult.zipSize)}
                          </Paragraph>
                        </Col>
                        <Col span={6}>
                          <Paragraph>
                            <InfoCircleOutlined style={{ color: '#52c41a' }} />
                            <span style={{ marginLeft: 8 }}>已自动打包为ZIP</span>
                          </Paragraph>
                        </Col>
                      </Row>
                    </Card>
                  </>
                )}
                
                {/* 当文件小于8MB时显示提示 */}
                {!gifResult.zipUrl && (
                  <>
                    <Divider />
                    <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                      <Paragraph style={{ margin: 0, color: '#52c41a' }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        文件小于8MB，可直接下载GIF文件
                      </Paragraph>
                    </Card>
                  </>
                )}
              </Space>
            </Card>
          )}
        </Col>
      </Row>
      </div>
    </div>
  );
};

export default VideoToGif;
