import React, { useState } from 'react';
import { Card, Button, Space, Input, message, Row, Col, Typography, Upload, Divider } from 'antd';
import { 
  LockOutlined, 
  UnlockOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined,
  UploadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { TextArea } = Input;
const { Title } = Typography;

const Base64Encode: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  // Base64 编码
  const encodeToBase64 = () => {
    try {
      if (!inputText.trim()) {
        message.warning('请输入要编码的文本');
        return;
      }
      
      const encoded = btoa(unescape(encodeURIComponent(inputText)));
      setOutputText(encoded);
      message.success('编码成功');
    } catch (error) {
      message.error('编码失败，请检查输入内容');
      console.error('Base64 encode error:', error);
    }
  };

  // Base64 解码
  const decodeFromBase64 = () => {
    try {
      if (!inputText.trim()) {
        message.warning('请输入要解码的Base64字符串');
        return;
      }
      
      const decoded = decodeURIComponent(escape(atob(inputText)));
      setOutputText(decoded);
      message.success('解码成功');
    } catch (error) {
      message.error('解码失败，请检查Base64格式是否正确');
      console.error('Base64 decode error:', error);
    }
  };

  // 文件上传处理
  const handleFileUpload: UploadProps['beforeUpload'] = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // 获取文件的base64编码（包含data URL前缀）
        const base64Data = result.split(',')[1] || result;
        setInputText(base64Data);
        setMode('decode');
        message.success('文件读取成功');
      }
    };
    
    // 判断文件类型
    if (file.type.startsWith('text/')) {
      // 文本文件，读取为文本
      reader.readAsText(file);
      setMode('encode');
    } else {
      // 二进制文件，读取为base64
      reader.readAsDataURL(file);
      setMode('decode');
    }
    
    return false; // 阻止默认上传行为
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      if (!outputText) {
        message.warning('没有可复制的内容');
        return;
      }
      
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      message.success('已复制到剪贴板');
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  // 清空内容
  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setCopied(false);
    message.info('已清空所有内容');
  };

  // 切换模式
  const switchMode = (newMode: 'encode' | 'decode') => {
    setMode(newMode);
    setInputText('');
    setOutputText('');
    setCopied(false);
  };

  // 示例数据
  const insertExample = () => {
    if (mode === 'encode') {
      setInputText('Hello, 世界！这是一个Base64编码示例。');
    } else {
      setInputText('SGVsbG8sIOS4lueVjO+8gei/meaYr+S4gOS4qkJhc2U2NOe8lueggeekvuS+i+OAgg==');
    }
    message.info('已插入示例数据');
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
        <Card 
          title={
            <Space>
              <LockOutlined />
              <span>Base64 编解码工具</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          {/* 模式切换 */}
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button 
                type={mode === 'encode' ? 'primary' : 'default'}
                icon={<LockOutlined />}
                onClick={() => switchMode('encode')}
              >
                编码模式
              </Button>
              <Button 
                type={mode === 'decode' ? 'primary' : 'default'}
                icon={<UnlockOutlined />}
                onClick={() => switchMode('decode')}
              >
                解码模式
              </Button>
            </Space>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginBottom: '16px' }}>
            <Space wrap>
              {mode === 'encode' ? (
                <Button 
                  type="primary" 
                  icon={<LockOutlined />}
                  onClick={encodeToBase64}
                >
                  Base64 编码
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<UnlockOutlined />}
                  onClick={decodeFromBase64}
                >
                  Base64 解码
                </Button>
              )}
              
              <Upload
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept={mode === 'encode' ? 'text/*' : '*'}
              >
                <Button icon={<UploadOutlined />}>
                  {mode === 'encode' ? '上传文本文件' : '上传文件'}
                </Button>
              </Upload>
              
              <Button onClick={insertExample}>
                插入示例
              </Button>
              
              <Button 
                danger
                icon={<ClearOutlined />}
                onClick={clearAll}
              >
                清空
              </Button>
            </Space>
          </div>

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title={
                  <Space>
                    <FileTextOutlined />
                    {mode === 'encode' ? '原始文本' : 'Base64 字符串'}
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <TextArea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    mode === 'encode' 
                      ? '请输入要编码的文本内容...' 
                      : '请输入要解码的Base64字符串...'
                  }
                  style={{ 
                    minHeight: '300px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px'
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  字符数：{inputText.length}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title={
                  <Space>
                    {mode === 'encode' ? <LockOutlined /> : <UnlockOutlined />}
                    {mode === 'encode' ? 'Base64 结果' : '解码结果'}
                  </Space>
                }
                extra={
                  <Button 
                    type="text" 
                    size="small"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={copyToClipboard}
                    style={{ color: copied ? '#52c41a' : undefined }}
                  >
                    {copied ? '已复制' : '复制'}
                  </Button>
                }
                style={{ marginBottom: '16px' }}
              >
                <TextArea
                  value={outputText}
                  readOnly
                  placeholder={
                    mode === 'encode' 
                      ? 'Base64编码结果将显示在这里...' 
                      : '解码结果将显示在这里...'
                  }
                  style={{ 
                    minHeight: '300px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px',
                    backgroundColor: '#f6f8fa'
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  字符数：{outputText.length}
                </div>
              </Card>
            </Col>
          </Row>

          <Divider />
          
          <div style={{ color: '#666', fontSize: '14px' }}>
            <Title level={5}>使用说明：</Title>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>编码模式：</strong>将普通文本转换为Base64编码字符串</li>
              <li><strong>解码模式：</strong>将Base64编码字符串还原为原始文本</li>
              <li>支持上传文件进行编码/解码操作</li>
              <li>支持中文和特殊字符的编解码</li>
              <li>可以复制结果到剪贴板</li>
              <li>Base64常用于数据传输、存储等场景</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Base64Encode;
