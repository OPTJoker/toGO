import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { Card, Button, Space, Input, message, Row, Col, Typography, Select, Tooltip } from 'antd';
import { 
  FormatPainterOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  ApartmentOutlined,
  CodeOutlined,
  AlignLeftOutlined
} from '@ant-design/icons';
import JsonView from '@uiw/react-json-view';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const SELECTED_BG = 'rgba(255, 126, 95, 0.1)'; // 选中背景色 - 主题色加透明度
const SELECTED_BORDER = '#ff7e5f'; // 选中边框色 - 主题色
const SELECTED_TEXT = '#ff7e5f'; // 选中文字色 - 主题色
const DEFAULT_BORDER = '#595959'; // 默认边框色 - 深灰色
const DEFAULT_TEXT = '#595959'; // 默认文字色 - 深灰色

const JsonFormatter: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'code'>('tree');
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [collapsed, setCollapsed] = useState<boolean | number>(false); // false表示全展开，true表示全收起，数字表示展开层数

  // 添加全局样式来覆盖Ant Design的默认focus样式
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ant-btn:focus,
      .ant-btn:hover,
      .ant-btn:active {
        box-shadow: none !important;
        outline: none !important;
      }
      .ant-btn:focus {
        border-color: inherit !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      setParsedJson(null);
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(inputJson);
      setOutputJson(JSON.stringify(parsed, null, indentSize));
      setParsedJson(parsed);
      setJsonError(null);
    } catch (err: unknown) {
      setOutputJson('');
      setParsedJson(null);
      setJsonError((err as Error).message || 'JSON解析错误');
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

  // 复制到剪贴板 - 修复版本
  const copyToClipboard = async () => {
    try {
      if (!outputJson) {
        message.warning('没有可复制的内容');
        return;
      }
      
      // 优先使用现代的 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(outputJson);
        setCopied(true);
        message.success('已复制到剪贴板');
      } else {
        // 降级方案：使用传统的 document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = outputJson;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            message.success('已复制到剪贴板');
          } else {
            throw new Error('execCommand failed');
          }
        } catch (err) {
          console.error('复制失败:', err);
          message.error('复制失败，请手动选择并复制文本');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('复制操作失败:', error);
      
      // 最后的降级方案：提示用户手动复制
      try {
        const textArea = document.createElement('textarea');
        textArea.value = outputJson;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        message.info('请按 Ctrl+C (或 Cmd+C) 手动复制选中的文本');
        
        setTimeout(() => {
          document.body.removeChild(textArea);
        }, 5000);
      } catch (_fallbackError) {
        message.error('复制功能不可用，请手动选择文本进行复制');
      }
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
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '400px', width: '100%' }}>
                    {/* 左侧功能按钮组 */}
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {/* 视图模式切换按钮 */}
                      <Tooltip title="树形视图" color="#262626" mouseEnterDelay={0.3}>
                        <Button 
                          type="default"
                          onClick={() => setViewMode('tree')}
                          icon={<ApartmentOutlined style={{ fontSize: '16px', color: viewMode === 'tree' ? SELECTED_TEXT : DEFAULT_TEXT }} />}
                          style={{ 
                            padding: '4px 12px', 
                            marginRight: 8,
                            backgroundColor: viewMode === 'tree' ? SELECTED_BG : '#ffffff',
                            borderColor: viewMode === 'tree' ? SELECTED_BORDER : DEFAULT_BORDER,
                            color: viewMode === 'tree' ? SELECTED_TEXT : DEFAULT_TEXT,
                            boxShadow: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'tree' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'tree' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'tree' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.outline = 'none';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'tree' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="代码视图" color="#262626" mouseEnterDelay={0.3}>
                        <Button 
                          type="default"
                          onClick={() => setViewMode('code')}
                          icon={<CodeOutlined style={{ fontSize: '16px', color: viewMode === 'code' ? SELECTED_TEXT : DEFAULT_TEXT }} />}
                          style={{ 
                            padding: '4px 12px', 
                            marginRight: 12,
                            backgroundColor: viewMode === 'code' ? SELECTED_BG : '#ffffff',
                            borderColor: viewMode === 'code' ? SELECTED_BORDER : DEFAULT_BORDER,
                            color: viewMode === 'code' ? SELECTED_TEXT : DEFAULT_TEXT,
                            boxShadow: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'code' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'code' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'code' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.outline = 'none';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = viewMode === 'code' ? SELECTED_BORDER : DEFAULT_BORDER;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </Tooltip>
                      
                      {viewMode === 'tree' && parsedJson && (
                        <>
                          <Tooltip title="全部展开" color="#262626" mouseEnterDelay={0.3}>
                            <Button 
                              type="default"
                              onClick={() => setCollapsed(false)}
                              icon={<ArrowsAltOutlined style={{ fontSize: '16px', color: collapsed === false ? SELECTED_TEXT : DEFAULT_TEXT }} />}
                              style={{ 
                                padding: '4px 12px', 
                                marginRight: 8,
                                backgroundColor: collapsed === false ? SELECTED_BG : '#ffffff',
                                borderColor: collapsed === false ? SELECTED_BORDER : DEFAULT_BORDER,
                                color: collapsed === false ? SELECTED_TEXT : DEFAULT_TEXT,
                                boxShadow: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = collapsed === false ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = collapsed === false ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = collapsed === false ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.outline = 'none';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = collapsed === false ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="全部收起" color="#262626" mouseEnterDelay={0.3}>
                            <Button 
                              type="default"
                              onClick={() => setCollapsed(true)}
                              icon={<ShrinkOutlined style={{ fontSize: '16px', color: collapsed === true ? SELECTED_TEXT : DEFAULT_TEXT }} />}
                              style={{ 
                                padding: '4px 12px', 
                                marginRight: 12,
                                backgroundColor: collapsed === true ? SELECTED_BG : '#ffffff',
                                borderColor: collapsed === true ? SELECTED_BORDER : DEFAULT_BORDER,
                                color: collapsed === true ? SELECTED_TEXT : DEFAULT_TEXT,
                                boxShadow: 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = collapsed === true ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = collapsed === true ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = collapsed === true ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.outline = 'none';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = collapsed === true ? SELECTED_BORDER : DEFAULT_BORDER;
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            />
                          </Tooltip>
                        </>
                      )}
                      
                      {/* 格式化/压缩按钮 - 只在代码视图下显示 */}
                      {viewMode === 'code' && outputJson && (
                        <Tooltip title={outputJson.includes('\n') && outputJson.includes('  ') ? '压缩' : '格式化'} color="#262626" mouseEnterDelay={0.3}>
                          <Button
                            type="default"
                            size="middle"
                            icon={<AlignLeftOutlined style={{ fontSize: '16px', color: (outputJson.includes('\n') && outputJson.includes('  ')) ? SELECTED_TEXT : DEFAULT_TEXT }} />}
                            onClick={() => {
                              if (outputJson.includes('\n') && outputJson.includes('  ')) {
                                compressJson();
                              } else {
                                formatJson();
                              }
                            }}
                            style={{ 
                              marginRight: 12, 
                              padding: '4px 12px', 
                              borderColor: (outputJson.includes('\n') && outputJson.includes('  ')) ? SELECTED_BORDER : DEFAULT_BORDER,
                              color: (outputJson.includes('\n') && outputJson.includes('  ')) ? SELECTED_TEXT : DEFAULT_TEXT,
                              backgroundColor: (outputJson.includes('\n') && outputJson.includes('  ')) ? SELECTED_BG : '#ffffff',
                              boxShadow: 'none'
                            }}
                          />
                        </Tooltip>
                      )}
                    </div>
                    
                    {/* 右侧操作按钮组 */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title={copied ? '已复制' : '复制'} color="#262626" mouseEnterDelay={0.3}>
                        <Button 
                          type="default"
                          size="middle"
                          icon={copied ? <CheckOutlined style={{ fontSize: '16px' }} /> : <CopyOutlined style={{ fontSize: '16px' }} />} 
                          onClick={copyToClipboard}
                          style={{ 
                            color: copied ? SELECTED_TEXT : DEFAULT_TEXT, 
                            border: `1px solid ${DEFAULT_BORDER}`, 
                            background: copied ? SELECTED_BG : '#fff',
                            marginRight: 8,
                            padding: '4px 12px'
                          }}
                        />
                      </Tooltip>

                      {!fullscreen && (
                        <Tooltip title="全屏" color="#262626" mouseEnterDelay={0.3}>
                          <Button
                            type="text"
                            size="middle"
                            icon={<FullscreenOutlined style={{ fontSize: '16px' }} />}
                            onClick={() => setFullscreen(true)}
                            style={{ padding: '4px 12px', borderColor: DEFAULT_BORDER }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
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
                    <Tooltip title="收起" color="#262626" mouseEnterDelay={0.3}>
                      <Button
                        type="default"
                        size="small"
                        icon={<FullscreenExitOutlined />}
                        onClick={() => setFullscreen(false)}
                        style={{
                          position: 'absolute',
                          top: 16,
                          right: 24,
                          zIndex: 2000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          backgroundColor: '#ffffff',
                          borderColor: DEFAULT_BORDER
                        }}
                      />
                    </Tooltip>
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
                      {viewMode === 'tree' && parsedJson ? (
                        // 树形视图
                        <JsonView 
                          value={parsedJson}
                          style={{
                            minHeight: fullscreen ? '100vh' : '640px',
                            fontSize: '16px',
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                            background: '#fff',
                            padding: '16px',
                            borderRadius: '8px',
                          }}
                          collapsed={collapsed} // 使用状态控制展开/收起
                          displayDataTypes={false}
                          displayObjectSize={false}
                          enableClipboard={false}
                        />
                      ) : (
                        // 代码视图（原有的语法高亮）
                        <>
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
                                color: '#0d47a1',
                                fontWeight: 'bold',
                                textAlign: 'left',
                                boxShadow: 'none',
                                textShadow: 'none',
                              },
                              'string': { color: '#1b5e20', fontWeight: 'bold', textShadow: 'none' },
                              'number': { color: '#ad1457', fontWeight: 'bold', textShadow: 'none' },
                              'key': { color: '#0d47a1', fontWeight: 'bold', textShadow: 'none' },
                              'punctuation': { color: '#222', fontWeight: 'bold', textShadow: 'none' },
                              'attr': { color: '#222', fontWeight: 'bold', textShadow: 'none' },
                              'operator': { color: '#222', fontWeight: 'bold', textShadow: 'none' },
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
                        </>
                      )}
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