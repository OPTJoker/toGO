import React, { useState } from 'react';
import { Card, Button, Space, Input, message, Row, Col, Typography, Divider } from 'antd';
import { 
  LinkOutlined, 
  UnlockOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title } = Typography;

const UrlEncode: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  // URL 编码
  const encodeUrl = () => {
    try {
      if (!inputText.trim()) {
        message.warning('请输入要编码的URL或文本');
        return;
      }
      
      const encoded = encodeURIComponent(inputText);
      setOutputText(encoded);
      message.success('URL编码成功');
    } catch (_error) {
      message.error('编码失败，请检查输入内容');
      console.error('URL encode error:', _error);
    }
  };

  // URL 解码
  const decodeUrl = () => {
    try {
      if (!inputText.trim()) {
        message.warning('请输入要解码的URL编码字符串');
        return;
      }
      
      const decoded = decodeURIComponent(inputText);
      setOutputText(decoded);
      message.success('URL解码成功');
    } catch (_error) {
      message.error('解码失败，请检查URL编码格式是否正确');
      console.error('URL decode error:', _error);
    }
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
      setInputText('https://example.com/search?q=JavaScript教程&type=文档&category=前端开发');
    } else {
      setInputText('https%3A//example.com/search%3Fq%3DJavaScript%E6%95%99%E7%A8%8B%26type%3D%E6%96%87%E6%A1%A3%26category%3D%E5%89%8D%E7%AB%AF%E5%BC%80%E5%8F%91');
    }
    message.info('已插入示例数据');
  };

  // 批量处理
  const batchProcess = () => {
    try {
      if (!inputText.trim()) {
        message.warning('请输入要处理的内容');
        return;
      }
      
      const lines = inputText.split('\n').filter(line => line.trim());
      const processedLines = lines.map(line => {
        try {
          return mode === 'encode' ? encodeURIComponent(line.trim()) : decodeURIComponent(line.trim());
        } catch {
          return `[处理失败] ${line}`;
        }
      });
      
      setOutputText(processedLines.join('\n'));
      message.success(`批量处理完成，共处理${lines.length}行`);
    } catch (_error) {
      message.error('批量处理失败');
      console.error('Batch process error:', _error);
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
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <Card 
          title={
            <Space>
              <LinkOutlined />
              <span>URL 编解码工具</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          {/* 模式切换 */}
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Button 
                type={mode === 'encode' ? 'primary' : 'default'}
                icon={<LinkOutlined />}
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
                  icon={<LinkOutlined />}
                  onClick={encodeUrl}
                >
                  URL 编码
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<UnlockOutlined />}
                  onClick={decodeUrl}
                >
                  URL 解码
                </Button>
              )}
              
              <Button 
                icon={<GlobalOutlined />}
                onClick={batchProcess}
              >
                批量处理
              </Button>
              
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
                title={mode === 'encode' ? '原始 URL/文本' : 'URL 编码字符串'}
                style={{ marginBottom: '16px' }}
              >
                <TextArea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    mode === 'encode' 
                      ? '请输入要编码的URL或文本...\n支持多行批量处理' 
                      : '请输入要解码的URL编码字符串...\n支持多行批量处理'
                  }
                  style={{ 
                    minHeight: '300px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px'
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  字符数：{inputText.length} | 行数：{inputText.split('\n').length}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title={mode === 'encode' ? 'URL 编码结果' : '解码结果'}
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
                      ? 'URL编码结果将显示在这里...' 
                      : 'URL解码结果将显示在这里...'
                  }
                  style={{ 
                    minHeight: '300px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px',
                    backgroundColor: '#f6f8fa'
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  字符数：{outputText.length} | 行数：{outputText.split('\n').length}
                </div>
              </Card>
            </Col>
          </Row>

          <Divider />
          
          <div style={{ color: '#666', fontSize: '14px' }}>
            <Title level={5}>使用说明：</Title>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>URL编码：</strong>将URL中的特殊字符转换为百分号编码格式</li>
              <li><strong>URL解码：</strong>将百分号编码还原为原始字符</li>
              <li>支持中文、特殊符号等字符的编解码</li>
              <li>支持多行文本的批量处理</li>
              <li>常用于URL参数处理、API调用等场景</li>
              <li>符合RFC 3986标准的URL编码规范</li>
            </ul>
            
            <Title level={5}>常见字符编码对照：</Title>
            <div style={{ background: '#f6f8fa', padding: '12px', borderRadius: '4px', fontFamily: 'monospace' }}>
              空格: %20 | 中文: %E4%B8%AD%E6%96%87 | #: %23 | ?: %3F | &: %26 | =: %3D | +: %2B
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UrlEncode;
