import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { Card, Button, Space, Input, message, Row, Col, Typography, Select } from 'antd';
import { 
  FormatPainterOutlined, 
  CompressOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const JsonFormatter: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // 格式化 JSON
  const formatJson = () => {
    // 保留原有按钮逻辑，但实际显示已实时
    try {
      if (!inputJson.trim()) {
        message.warning('请输入要格式化的JSON数据');
        return;
      }
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutputJson(formatted);
      message.success('JSON格式化成功');
    } catch (error) {
      message.error('JSON格式错误，请检查输入');
      console.error('JSON parse error:', error);
    }
  };

  // 实时解析输入内容
  React.useEffect(() => {
    if (!inputJson.trim()) {
      setOutputJson('');
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(inputJson);
      setOutputJson(JSON.stringify(parsed, null, indentSize));
      setJsonError(null);
    } catch (err: any) {
      setOutputJson('');
      setJsonError(err.message || 'JSON解析错误');
    }
  }, [inputJson, indentSize]);

  // 压缩 JSON
  const compressJson = () => {
    try {
      if (!inputJson.trim()) {
        message.warning('请输入要压缩的JSON数据');
        return;
      }
      
      const parsed = JSON.parse(inputJson);
      const compressed = JSON.stringify(parsed);
      setOutputJson(compressed);
      message.success('JSON压缩成功');
    } catch (error) {
      message.error('JSON格式错误，请检查输入');
      console.error('JSON parse error:', error);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      if (!outputJson) {
        message.warning('没有可复制的内容');
        return;
      }
      
      await navigator.clipboard.writeText(outputJson);
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
    setInputJson('');
    setOutputJson('');
    message.info('已清空所有内容');
  };

  // 示例 JSON
  const insertExample = () => {
    const example = {
      "name": "张三",
      "age": 30,
      "city": "北京",
      "skills": ["JavaScript", "React", "Node.js"],
      "address": {
        "street": "中关村大街",
        "number": 123,
        "zipcode": "100000"
      },
      "active": true,
      "projects": [
        {
          "name": "项目A",
          "status": "完成",
          "technologies": ["React", "TypeScript"]
        },
        {
          "name": "项目B",
          "status": "进行中",
          "technologies": ["Vue", "Python"]
        }
      ]
    };
    
    setInputJson(JSON.stringify(example));
    message.info('已插入示例JSON');
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
              <FormatPainterOutlined />
              <span>JSON 格式化工具</span>
            </Space>
          }
          extra={
            <Space>
              <Text type="secondary">缩进大小：</Text>
              <Select 
                value={indentSize} 
                onChange={setIndentSize}
                style={{ width: 80 }}
                size="small"
              >
                <Option value={2}>2空格</Option>
                <Option value={4}>4空格</Option>
                <Option value={8}>8空格</Option>
              </Select>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          {/* ...existing code... */}

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title="输入 JSON" 
                style={{ marginBottom: '16px' }}
                extra={
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8 }}>
                    <Button
                      icon={<FormatPainterOutlined />}
                      size="small"
                      onClick={insertExample}
                    >
                      插入示例
                    </Button>
                    <Button
                      icon={<ClearOutlined />}
                      danger
                      size="small"
                      onClick={clearAll}
                    >
                      清空
                    </Button>
                  </div>
                }
              >
                <TextArea
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  placeholder="请输入要处理的JSON数据..."
                  style={{ 
                    minHeight: '640px',
                    fontFamily: 'Monaco, Menlo, \"Ubuntu Mono\", Consolas, source-code-pro, monospace',
                    fontSize: '15px'
                  }}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title="输出结果"
                extra={
                  <Space>
                    {/* 状态互斥按钮：格式化/压缩 */}
                    {(() => {
                      // 判断当前 outputJson 是否为压缩状态（无换行/无缩进）
                      if (!outputJson) {
                        return (
                          <Button
                            type="primary"
                            size="small"
                            icon={<FormatPainterOutlined />}
                            onClick={formatJson}
                            style={{ marginRight: 8 }}
                          >
                            格式化
                          </Button>
                        );
                      }
                      // 如果已经格式化（有换行和缩进），则显示压缩按钮
                      if (outputJson.includes('\n') && outputJson.includes('  ')) {
                        return (
                          <Button
                            type="primary"
                            size="small"
                            icon={<CompressOutlined />}
                            onClick={() => {
                              compressJson();
                            }}
                            style={{ marginRight: 8 }}
                          >
                            压缩
                          </Button>
                        );
                      }
                      // 否则显示格式化按钮
                      return (
                        <Button
                          type="primary"
                          size="small"
                          icon={<FormatPainterOutlined />}
                          onClick={() => {
                            formatJson();
                          }}
                          style={{ marginRight: 8 }}
                        >
                          格式化
                        </Button>
                      );
                    })()}
                    <Button 
                      type="default"
                      size="small"
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />} 
                      onClick={copyToClipboard}
                      style={{ color: copied ? '#52c41a' : undefined, border: '1px solid #d9d9d9', background: '#fff' }}
                    >
                      {copied ? '已复制' : '复制'}
                    </Button>
                    <Button
                      icon={<ClearOutlined />}
                      danger
                      size="small"
                      onClick={clearAll}
                      style={{ marginLeft: 8 }}
                    >
                      清空
                    </Button>
                    <Button
                      size="small"
                      icon={<FormatPainterOutlined />}
                      onClick={insertExample}
                      style={{ marginLeft: 8 }}
                    >
                      插入示例
                    </Button>
                    {!fullscreen && (
                      <Button
                        type="text"
                        size="small"
                        icon={<FullscreenOutlined />}
                        onClick={() => setFullscreen(true)}
                      >
                        全屏
                      </Button>
                    )}
                  </Space>
                }
                style={{ marginBottom: '16px', position: 'relative', zIndex: fullscreen ? 1001 : 'auto' }}
                bodyStyle={fullscreen ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: '#fff',
                  zIndex: 1000,
                  margin: 0,
                  padding: 0,
                  borderRadius: 0,
                  boxShadow: 'none',
                  overflow: 'auto',
                } : undefined}
              >
                <div style={{ minHeight: fullscreen ? '100vh' : '640px', background: '#fff', borderRadius: 8, padding: 0, position: 'relative', textAlign: 'left' }}>
                  {/* 全屏收起按钮，绝对定位，始终可见 */}
                  {fullscreen && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<FullscreenExitOutlined />}
                      onClick={() => setFullscreen(false)}
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 24,
                        zIndex: 2000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                      }}
                    >
                      收起
                    </Button>
                  )}
                  {jsonError ? (
                    <div style={{
                      color: '#c62828',
                      fontWeight: 700,
                      fontSize: '20px',
                      padding: '32px',
                      textAlign: 'left',
                      boxShadow: 'none',
                    }}>
                      {jsonError}
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
                      {/* 强制加粗、无阴影、自动换行所有高亮内容 */}
                      <style>{`
                        .hljs, .hljs * {
                          font-weight: bold !important;
                          font-family: inherit !important;
                          text-shadow: none !important;
                          word-break: break-all !important;
                          white-space: pre-wrap !important;
                        }
                      `}</style>
                      <SyntaxHighlighter
                        language="json"
                        style={{
                          ...dracula,
                          'hljs': {
                            ...dracula.hljs,
                            background: '#fff',
                            color: '#0d47a1', // 深蓝色
                            fontWeight: 'bold',
                            textAlign: 'left',
                            boxShadow: 'none',
                            textShadow: 'none',
                          },
                          'string': { color: '#1b5e20', fontWeight: 'bold', textShadow: 'none' }, // 深绿色
                          'number': { color: '#ad1457', fontWeight: 'bold', textShadow: 'none' }, // 深粉色
                          'key': { color: '#0d47a1', fontWeight: 'bold', textShadow: 'none' }, // 深蓝色
                          'punctuation': { color: '#222', fontWeight: 'bold', textShadow: 'none' },
                          'attr': { color: '#222', fontWeight: 'bold', textShadow: 'none' }, // 属性名冒号
                          'operator': { color: '#222', fontWeight: 'bold', textShadow: 'none' }, // 冒号
                        }}
                        customStyle={{
                          minHeight: fullscreen ? '100vh' : '640px',
                          fontSize: '16px',
                          margin: 0,
                          borderRadius: 8,
                          background: '#fff',
                          fontWeight: 'bold',
                          textAlign: 'left',
                          boxShadow: 'none',
                          textShadow: 'none',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                        wrapLines={true}
                        lineProps={{ style: { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }}
                      >
                        {outputJson || '// 格式化后的JSON将显示在这里...'}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default JsonFormatter;
