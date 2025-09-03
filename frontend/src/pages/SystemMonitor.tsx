import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space, 
  Progress,
  Alert,
  message,
  Descriptions,
  Typography
} from 'antd';
import { 
  DeleteOutlined, 
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { systemApi } from '../api';

const { Title } = Typography;

interface SystemInfo {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  uploadsSize: number;
  outputSize: number;
  goroutines: number;
  timestamp: string;
}

const SystemMonitor: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const loadSystemInfo = async () => {
    setLoading(true);
    try {
      const data = await systemApi.getHealth();
      setSystemInfo(data);
    } catch (error) {
      message.error('获取系统信息失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      await systemApi.cleanup();
      message.success('清理完成');
      // 重新加载系统信息
      loadSystemInfo();
    } catch (error) {
      message.error('清理失败');
      console.error(error);
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();
    // 每30秒自动刷新
    const interval = setInterval(loadSystemInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageStatus = () => {
    if (!systemInfo) return 'normal';
    const totalStorage = systemInfo.uploadsSize + systemInfo.outputSize;
    const maxStorage = 30 * 1024 * 1024 * 1024; // 30GB 警告线
    
    if (totalStorage > maxStorage) return 'danger';
    if (totalStorage > maxStorage * 0.8) return 'warning';
    return 'normal';
  };

  const memoryUsagePercent = systemInfo 
    ? Math.round((systemInfo.memoryUsage / systemInfo.memoryTotal) * 100)
    : 0;

  const storageStatus = getStorageStatus();

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Title level={2}>系统监控</Title>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadSystemInfo}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />}
              onClick={handleCleanup}
              loading={cleanupLoading}
            >
              清理文件
            </Button>
          </Space>
        </Col>
      </Row>

      {storageStatus !== 'normal' && (
        <Alert
          message="存储空间警告"
          description={
            storageStatus === 'danger' 
              ? "存储空间已超过30GB，建议立即清理文件"
              : "存储空间接近30GB，建议尽快清理文件"
          }
          type={storageStatus === 'danger' ? 'error' : 'warning'}
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="内存使用率"
              value={memoryUsagePercent}
              suffix="%"
              valueStyle={{ 
                color: memoryUsagePercent > 80 ? '#cf1322' : '#3f8600' 
              }}
              prefix={
                memoryUsagePercent > 80 ? <WarningOutlined /> : <CheckCircleOutlined />
              }
            />
            <Progress 
              percent={memoryUsagePercent} 
              showInfo={false} 
              strokeColor={memoryUsagePercent > 80 ? '#ff4d4f' : '#52c41a'}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="上传文件大小"
              value={systemInfo ? formatBytes(systemInfo.uploadsSize) : '-'}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="输出文件大小"
              value={systemInfo ? formatBytes(systemInfo.outputSize) : '-'}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃协程"
              value={systemInfo?.goroutines || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="详细信息">
            <Descriptions column={2}>
              <Descriptions.Item label="内存使用">
                {systemInfo ? formatBytes(systemInfo.memoryUsage) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="内存总量">
                {systemInfo ? formatBytes(systemInfo.memoryTotal) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="总存储使用">
                {systemInfo ? formatBytes(systemInfo.uploadsSize + systemInfo.outputSize) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新">
                {systemInfo?.timestamp ? new Date(systemInfo.timestamp).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Alert
            message="优化建议"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>定期清理临时文件以释放存储空间</li>
                <li>上传文件限制在50MB以内以适配服务器带宽</li>
                <li>系统会自动清理24小时前的上传文件和12小时前的输出文件</li>
                <li>建议在存储使用超过80%时进行手动清理</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Col>
      </Row>
    </div>
  );
};

export default SystemMonitor;
