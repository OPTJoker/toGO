import React, { useState } from 'react';
import { Card, Button, Space, Input, message, Row, Col, Typography, Switch, Divider, Tag, Collapse } from 'antd';
import { 
  BugOutlined, 
  PlayCircleOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Panel } = Collapse;

interface MatchResult {
  match: string;
  index: number;
  groups?: string[];
}

const RegexTest: React.FC = () => {
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false,
  });
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [copied, setCopied] = useState(false);

  // 执行正则匹配
  const executeRegex = () => {
    try {
      if (!pattern.trim()) {
        message.warning('请输入正则表达式');
        return;
      }

      if (!testString.trim()) {
        message.warning('请输入测试字符串');
        return;
      }

      // 构建正则表达式标志
      let flagStr = '';
      if (flags.global) flagStr += 'g';
      if (flags.ignoreCase) flagStr += 'i';
      if (flags.multiline) flagStr += 'm';
      if (flags.dotAll) flagStr += 's';
      if (flags.unicode) flagStr += 'u';
      if (flags.sticky) flagStr += 'y';

      const regex = new RegExp(pattern, flagStr);
      const results: MatchResult[] = [];

      if (flags.global) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          
          // 防止无限循环
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(results);
      setIsValid(true);
      message.success(`匹配完成，找到 ${results.length} 个结果`);
    } catch (error) {
      setIsValid(false);
      setMatches([]);
      message.error('正则表达式语法错误');
      console.error('Regex error:', error);
    }
  };

  // 复制匹配结果
  const copyResults = async () => {
    try {
      if (matches.length === 0) {
        message.warning('没有匹配结果可复制');
        return;
      }

      const resultText = matches.map((match, index) => 
        `${index + 1}. "${match.match}" (位置: ${match.index})`
      ).join('\n');

      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      message.success('匹配结果已复制到剪贴板');
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  // 清空所有内容
  const clearAll = () => {
    setPattern('');
    setTestString('');
    setMatches([]);
    setIsValid(true);
    setCopied(false);
    message.info('已清空所有内容');
  };

  // 插入常用正则示例
  const insertExample = (type: string) => {
    const examples = {
      email: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        test: 'test@example.com\ninvalid-email\nuser.name+tag@domain.co.uk'
      },
      phone: {
        pattern: '1[3-9]\\d{9}',
        test: '13812345678\n15987654321\n123456789'
      },
      url: {
        pattern: 'https?://[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?',
        test: 'https://www.example.com\nhttp://test.com/path?param=value\nftp://invalid.url'
      },
      ip: {
        pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
        test: '192.168.1.1\n127.0.0.1\n256.256.256.256\n10.0.0.1'
      },
      date: {
        pattern: '\\d{4}-\\d{2}-\\d{2}',
        test: '2024-01-15\n2023-12-31\ninvalid-date\n2024/01/15'
      },
      idcard: {
        pattern: '[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]',
        test: '110101199003071234\n123456789012345678\n11010119900307123X'
      }
    };

    const example = examples[type as keyof typeof examples];
    if (example) {
      setPattern(example.pattern);
      setTestString(example.test);
      setFlags({ ...flags, global: true, ignoreCase: false });
      message.info(`已插入${type}正则示例`);
    }
  };

  // 高亮显示匹配结果
  const highlightMatches = () => {
    if (!testString || matches.length === 0) return testString;

    let result = testString;

    // 按位置倒序排列，避免插入标签后位置偏移
    const sortedMatches = [...matches].sort((a, b) => b.index - a.index);

    sortedMatches.forEach((match) => {
      const start = match.index;
      const end = match.index + match.match.length;
      const before = result.substring(0, start);
      const matchText = result.substring(start, end);
      const after = result.substring(end);
      
      result = before + `【${matchText}】` + after;
    });

    return result;
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
              <BugOutlined />
              <span>正则表达式测试工具</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          {/* 正则表达式输入 */}
          <Card size="small" title="正则表达式" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="请输入正则表达式（不需要添加分隔符）..."
                style={{ 
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                  fontSize: '14px'
                }}
                status={!isValid ? 'error' : undefined}
              />
              
              {/* 标志设置 */}
              <div>
                <Text strong>标志：</Text>
                <Space wrap style={{ marginLeft: '8px' }}>
                  <span>
                    <Switch 
                      size="small" 
                      checked={flags.global} 
                      onChange={(checked) => setFlags({...flags, global: checked})}
                    />
                    <Text style={{ marginLeft: '4px' }}>g (全局)</Text>
                  </span>
                  <span>
                    <Switch 
                      size="small" 
                      checked={flags.ignoreCase} 
                      onChange={(checked) => setFlags({...flags, ignoreCase: checked})}
                    />
                    <Text style={{ marginLeft: '4px' }}>i (忽略大小写)</Text>
                  </span>
                  <span>
                    <Switch 
                      size="small" 
                      checked={flags.multiline} 
                      onChange={(checked) => setFlags({...flags, multiline: checked})}
                    />
                    <Text style={{ marginLeft: '4px' }}>m (多行)</Text>
                  </span>
                  <span>
                    <Switch 
                      size="small" 
                      checked={flags.dotAll} 
                      onChange={(checked) => setFlags({...flags, dotAll: checked})}
                    />
                    <Text style={{ marginLeft: '4px' }}>s (单行)</Text>
                  </span>
                </Space>
              </div>
            </Space>
          </Card>

          {/* 操作按钮 */}
          <div style={{ marginBottom: '16px' }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={executeRegex}
              >
                执行匹配
              </Button>
              
              <Button onClick={() => insertExample('email')}>邮箱</Button>
              <Button onClick={() => insertExample('phone')}>手机号</Button>
              <Button onClick={() => insertExample('url')}>URL</Button>
              <Button onClick={() => insertExample('ip')}>IP地址</Button>
              <Button onClick={() => insertExample('date')}>日期</Button>
              <Button onClick={() => insertExample('idcard')}>身份证</Button>
              
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
                title="测试字符串"
                style={{ marginBottom: '16px' }}
              >
                <TextArea
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="请输入要测试的字符串..."
                  style={{ 
                    minHeight: '200px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px'
                  }}
                />
              </Card>

              {/* 高亮显示结果 */}
              {matches.length > 0 && (
                <Card 
                  size="small" 
                  title="匹配高亮"
                  style={{ marginBottom: '16px' }}
                >
                  <div style={{
                    background: '#f6f8fa',
                    padding: '12px',
                    borderRadius: '4px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '13px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {highlightMatches()}
                  </div>
                </Card>
              )}
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title={
                  <Space>
                    <span>匹配结果</span>
                    <Tag color={matches.length > 0 ? 'green' : 'default'}>
                      {matches.length} 个匹配
                    </Tag>
                  </Space>
                }
                extra={
                  matches.length > 0 && (
                    <Button 
                      type="text" 
                      size="small"
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={copyResults}
                      style={{ color: copied ? '#52c41a' : undefined }}
                    >
                      {copied ? '已复制' : '复制结果'}
                    </Button>
                  )
                }
                style={{ marginBottom: '16px' }}
              >
                {matches.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {matches.map((match, index) => (
                      <div key={index} style={{ 
                        marginBottom: '8px',
                        padding: '8px',
                        background: '#f0f0f0',
                        borderRadius: '4px'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                          匹配 {index + 1}: "{match.match}"
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          位置: {match.index} - {match.index + match.match.length - 1}
                        </div>
                        {match.groups && match.groups.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            捕获组: [{match.groups.join(', ')}]
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#999', 
                    padding: '20px 0' 
                  }}>
                    暂无匹配结果
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Divider />
          
          {/* 使用说明 */}
          <Collapse>
            <Panel header={
              <Space>
                <InfoCircleOutlined />
                <span>使用说明与语法参考</span>
              </Space>
            } key="help">
              <div style={{ color: '#666', fontSize: '14px' }}>
                <Title level={5}>基本用法：</Title>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>在"正则表达式"框中输入表达式，无需添加分隔符</li>
                  <li>在"测试字符串"框中输入要匹配的文本</li>
                  <li>选择合适的标志（全局、忽略大小写等）</li>
                  <li>点击"执行匹配"查看结果</li>
                </ul>

                <Title level={5}>常用语法：</Title>
                <div style={{ 
                  background: '#f6f8fa', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  <div><strong>字符类：</strong></div>
                  <div>. 任意字符 | \d 数字 | \w 字母数字下划线 | \s 空白字符</div>
                  <div>\D 非数字 | \W 非字母数字 | \S 非空白字符</div>
                  <br />
                  <div><strong>量词：</strong></div>
                  <div>* 0或多个 | + 1或多个 | ? 0或1个 | {'{n}'} n个 | {'{n,m}'} n到m个</div>
                  <br />
                  <div><strong>边界：</strong></div>
                  <div>^ 行首 | $ 行尾 | \b 单词边界 | \B 非单词边界</div>
                  <br />
                  <div><strong>分组：</strong></div>
                  <div>() 捕获组 | (?:) 非捕获组 | | 或运算符</div>
                </div>
              </div>
            </Panel>
          </Collapse>
        </Card>
      </div>
    </div>
  );
};

export default RegexTest;
