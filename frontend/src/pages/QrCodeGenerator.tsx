import React, { useState } from 'react';
import { Card, Input, Button, Space, Row, Col, Typography, Select, ColorPicker, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { qrcodeApi } from '../api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const QrCodeGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // 生成二维码
  const generateQrCode = async () => {
    if (!text.trim()) {
      message.error('请输入要生成二维码的内容');
      return;
    }

    setLoading(true);
    
    try {
      const response = await qrcodeApi.generateQRCode({
        text: text.trim(),
        size,
        level,
        color,
        bgColor,
      });

      if (response.success && response.data) {
        setQrCodeDataUrl(response.data);
        message.success('二维码生成成功');
      } else {
        message.error(response.message || '生成二维码失败');
      }
    } catch (error) {
      console.error('生成二维码失败:', error);
      message.error('生成二维码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 下载二维码
  const downloadQrCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = 'qrcode.png';
    link.click();
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
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
          二维码生成器
        </Title>
        
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="输入内容" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <TextArea
                  placeholder="请输入要生成二维码的文本内容，如：网址、文本、联系信息等"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  showCount
                />
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>尺寸：</Text>
                    <Select
                      value={size}
                      onChange={setSize}
                      style={{ width: '100%', marginTop: '8px' }}
                      options={[
                        { label: '64x64', value: 64 },
                        { label: '128x128', value: 128 },
                        { label: '256x256', value: 256 },
                        { label: '512x512', value: 512 },
                        { label: '1024x1024', value: 1024 }
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong>容错级别：</Text>
                    <Select
                      value={level}
                      onChange={setLevel}
                      style={{ width: '100%', marginTop: '8px' }}
                      options={[
                        { label: 'L (7%)', value: 'L' },
                        { label: 'M (15%)', value: 'M' },
                        { label: 'Q (25%)', value: 'Q' },
                        { label: 'H (30%)', value: 'H' }
                      ]}
                    />
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>前景色：</Text>
                    <div style={{ marginTop: '8px' }}>
                      <ColorPicker
                        value={color}
                        onChange={(value) => setColor(value.toHexString())}
                        showText
                        size="small"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>背景色：</Text>
                    <div style={{ marginTop: '8px' }}>
                      <ColorPicker
                        value={bgColor}
                        onChange={(value) => setBgColor(value.toHexString())}
                        showText
                        size="small"
                      />
                    </div>
                  </Col>
                </Row>

                <Button 
                  type="primary" 
                  onClick={generateQrCode}
                  loading={loading}
                  size="large"
                  style={{ width: '100%' }}
                >
                  {loading ? '生成中...' : '生成二维码'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title="生成结果"
              extra={qrCodeDataUrl && (
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadQrCode}
                  size="small"
                >
                  下载
                </Button>
              )}
            >
              <div style={{ textAlign: 'center', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {qrCodeDataUrl ? (
                  <div>
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Generated QR Code"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px'
                      }}
                      onError={() => {
                        console.error('二维码图片加载失败');
                        message.error('二维码图片加载失败，请重新生成');
                        setQrCodeDataUrl('');
                      }}
                      onLoad={() => {
                        console.log('二维码图片加载成功');
                      }}
                    />
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">尺寸: {size}x{size} | 容错: {level}</Text>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#999' }}>
                    <Text>请在左侧输入内容并点击生成二维码</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Card title="使用说明" style={{ marginTop: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div>
                <Text strong>支持的内容类型：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>网址链接 (http://example.com)</li>
                  <li>邮箱地址 (mailto:example@email.com)</li>
                  <li>电话号码 (tel:+1234567890)</li>
                  <li>WiFi信息 (WIFI:T:WPA;S:网络名;P:密码;;)</li>
                  <li>纯文本内容</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text strong>容错级别说明：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>L (Low): 约7%的错误恢复能力</li>
                  <li>M (Medium): 约15%的错误恢复能力</li>
                  <li>Q (Quartile): 约25%的错误恢复能力</li>
                  <li>H (High): 约30%的错误恢复能力</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default QrCodeGenerator;
