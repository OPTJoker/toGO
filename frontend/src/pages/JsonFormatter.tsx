import React, { useState } from 'react';
import { Card, Button, Space, Input, message, Row, Col, Typography, Select, Divider } from 'antd';
import { 
  FormatPainterOutlined, 
  CompressOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const JsonFormatter: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);

  // 格式化 JSON
  const formatJson = () => {
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

  // 验证 JSON
  const validateJson = () => {
    try {
      if (!inputJson.trim()) {
        message.warning('请输入要验证的JSON数据');
        return;
      }
      
      JSON.parse(inputJson);
      message.success('JSON格式正确');
    } catch (error) {
      message.error('JSON格式错误');
      console.error('JSON validation error:', error);
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
          <div style={{ marginBottom: '16px' }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<FormatPainterOutlined />}
                onClick={formatJson}
              >
                格式化
              </Button>
              <Button 
                icon={<CompressOutlined />}
                onClick={compressJson}
              >
                压缩
              </Button>
              <Button onClick={validateJson}>
                验证格式
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
                title="输入 JSON" 
                style={{ marginBottom: '16px' }}
              >
                <TextArea
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  placeholder="请输入要处理的JSON数据..."
                  style={{ 
                    minHeight: '400px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px'
                  }}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title="输出结果"
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
                  value={outputJson}
                  readOnly
                  placeholder="格式化后的JSON将显示在这里..."
                  style={{ 
                    minHeight: '400px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px',
                    backgroundColor: '#f6f8fa'
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />
          
          <div style={{ color: '#666', fontSize: '14px' }}>
            <Title level={5}>使用说明：</Title>
            <ul style={{ paddingLeft: '20px' }}>
              <li>在左侧输入框中粘贴或输入JSON数据</li>
              <li>点击"格式化"按钮美化JSON格式，或点击"压缩"按钮压缩JSON</li>
              <li>可以调整缩进大小（2、4、8个空格）</li>
              <li>点击"验证格式"检查JSON语法是否正确</li>
              <li>支持复制格式化后的结果到剪贴板</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JsonFormatter;
