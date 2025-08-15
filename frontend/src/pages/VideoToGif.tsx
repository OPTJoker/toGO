import React, { useState, useRef, useEffect } from 'react';
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
  List,
  message,
  Modal
} from 'antd';
import { 
  InboxOutlined, 
  PlayCircleOutlined, 
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { videoToGifApi } from '../api';
import type { VideoToGifRequest, ConversionHistoryItem } from '../types';

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
  const [gifResult, setGifResult] = useState<{url: string; size: number; duration: number; videoDuration: number} | null>(null);
  const [historyList, setHistoryList] = useState<ConversionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(20);  // 添加页面大小状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);  // 删除确认弹窗状态
  const [itemToDelete, setItemToDelete] = useState<ConversionHistoryItem | null>(null);  // 要删除的项目
  const videoRef = useRef<HTMLVideoElement>(null);

  // 加载历史记录
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await videoToGifApi.getHistory();
      // 确保返回的是数组，提供健壮性
      if (Array.isArray(history)) {
        setHistoryList(history);
      } else {
        console.warn('API返回的历史记录不是数组格式:', history);
        setHistoryList([]);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
      // 发生错误时设置为空数组，避免页面崩溃
      setHistoryList([]);
      // 只在不是网络连接问题时显示错误提示
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'NETWORK_ERROR') {
        message.error('获取历史记录失败');
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // 组件加载时获取历史记录
  useEffect(() => {
    loadHistory();
  }, []);

  // 删除历史记录
  const handleDeleteHistory = async (item: ConversionHistoryItem) => {
    try {
      await videoToGifApi.deleteHistory(item.id);
      message.success('删除成功');
      // 重新加载历史记录
      loadHistory();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const uploadProps: UploadProps = {
    name: 'video',
    multiple: false,
    accept: 'video/*',
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        alert('只能上传视频文件！');
        return false;
      }
      
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        alert('视频文件大小不能超过 100MB！');
        return false;
      }

      setVideoFile(file);
      
      // 创建预览
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
      alert('请先上传视频文件');
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
      });
      
      // 转换成功后刷新历史记录
      loadHistory();
      message.success('转换成功！');
    } catch (error: any) {
      console.error('转换失败:', error);
      
      // 显示更详细的错误信息
      let errorMessage = '转换失败，请重试';
      
      if (error.response) {
        // 服务器返回错误响应
        console.error('Error response:', error.response.data);
        if (error.response.data?.message) {
          errorMessage = `转换失败: ${error.response.data.message}`;
        } else if (error.response.status === 500) {
          errorMessage = '服务器内部错误，请检查视频文件格式';
        } else if (error.response.status === 413) {
          errorMessage = '文件太大，请选择较小的视频文件';
        }
      } else if (error.request) {
        // 网络错误
        console.error('Network error:', error.request);
        errorMessage = '网络连接失败，请检查网络连接或确保后端服务正在运行';
      } else {
        // 其他错误
        console.error('Error:', error.message);
        errorMessage = `错误: ${error.message}`;
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

  const handleDownload = async () => {
    if (gifResult) {
      try {
        // 构建完整的下载URL
        const downloadUrl = gifResult.url.startsWith('http') 
          ? gifResult.url 
          : `http://localhost:19988${gifResult.url}`;
        
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
                <p style={{ margin: '4px 0' }}>支持上传MP4、AVI、MOV等常见视频格式</p>
                <p style={{ margin: '4px 0' }}>文件大小限制为100MB</p>
              </div>
            </Dragger>

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
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                >
                  下载GIF
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Image
                  src={gifResult.url}
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
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {/* 转换历史记录 */}
      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card 
            title="转换历史" 
            extra={
              <Button 
                onClick={loadHistory} 
                loading={loadingHistory}
                size="small"
              >
                刷新
              </Button>
            }
          >
            <List
              loading={loadingHistory}
              dataSource={historyList || []}  // 确保始终是数组
              locale={{ emptyText: '暂无转换记录' }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    borderRadius: '8px',
                    margin: '4px 0',
                    padding: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  actions={[
                    <Button 
                      key="download"
                      type="link" 
                      icon={<DownloadOutlined />}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          // 构建完整的下载URL
                          const downloadUrl = item.gifUrl.startsWith('http') 
                            ? item.gifUrl 
                            : `http://localhost:19988${item.gifUrl}`;
                            
                          // 使用fetch获取二进制数据，强制下载
                          const response = await fetch(downloadUrl, {
                            method: 'GET',
                            headers: {
                              'Content-Type': 'application/octet-stream',
                            },
                          });
                          
                          if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                          }
                          
                          const blob = await response.blob();
                          
                          // 创建下载链接
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = item.filename;
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
                      }}
                    >
                      下载
                    </Button>,
                    <Button 
                      key="preview"
                      type="link"
                      onClick={() => {
                        // 直接在新窗口打开预览
                        window.open(item.gifUrl, '_blank');
                      }}
                    >
                      预览
                    </Button>,
                    <Button 
                      key="delete"
                      type="link" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        // 设置要删除的项目并显示确认弹窗
                        setItemToDelete(item);
                        setDeleteModalVisible(true);
                      }}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Image
                        width={60}
                        height={60}
                        src={item.gifUrl}
                        style={{ borderRadius: '4px' }}
                        preview={false}
                      />
                    }
                    title={
                      <Space>
                        <span>{item.filename}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          {formatFileSize(item.fileSize)}
                        </span>
                      </Space>
                    }
                    description={
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </span>
                    }
                  />
                </List.Item>
              )}
              pagination={historyList && historyList.length > 0 ? {
                pageSize: currentPageSize,  // 使用状态中的页面大小
                size: 'small',
                showSizeChanger: true,  // 允许用户改变页面大小
                pageSizeOptions: ['10', '20', '50', '100'],  // 页面大小选项
                showQuickJumper: true,  // 显示快速跳转
                onShowSizeChange: (_, size) => {
                  setCurrentPageSize(size);  // 当用户改变页面大小时更新状态
                },
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
              } : false}
            />
          </Card>
        </Col>
      </Row>
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={() => {
          if (itemToDelete) {
            handleDeleteHistory(itemToDelete);
            setDeleteModalVisible(false);
            setItemToDelete(null);
          }
        }}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
        okText="确定删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={400}
        centered
        style={{ top: 20 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <DeleteOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>确定要删除这个GIF文件吗？</p>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '0' }}>此操作不可恢复</p>
          {itemToDelete && (
            <p style={{ fontSize: '14px', color: '#999', marginTop: '16px' }}>
              文件名：{itemToDelete.filename}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default VideoToGif;
