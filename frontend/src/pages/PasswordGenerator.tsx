import React, { useState } from 'react';
import { Card, Button, Space, Row, Col, Typography, Slider, Checkbox, Input, message } from 'antd';
import { CopyOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);

  const generatePassword = () => {
    let charset = '';
    let uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    let numberChars = '0123456789';
    let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // 排除相似字符
    if (excludeSimilar) {
      uppercaseChars = uppercaseChars.replace(/[O]/g, '');
      lowercaseChars = lowercaseChars.replace(/[l]/g, '');
      numberChars = numberChars.replace(/[01]/g, '');
    }

    if (includeUppercase) charset += uppercaseChars;
    if (includeLowercase) charset += lowercaseChars;
    if (includeNumbers) charset += numberChars;
    if (includeSymbols) charset += symbolChars;

    if (charset === '') {
      message.warning('请至少选择一种字符类型');
      return;
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(result);
  };

  const copyPassword = () => {
    if (!password) {
      message.warning('请先生成密码');
      return;
    }
    
    navigator.clipboard.writeText(password).then(() => {
      message.success('密码已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: '无', color: '#d9d9d9' };
    
    let score = 0;
    
    // 长度评分
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    
    // 字符类型评分
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score <= 2) return { level: 1, text: '弱', color: '#ff4d4f' };
    if (score <= 4) return { level: 2, text: '中等', color: '#faad14' };
    if (score <= 6) return { level: 3, text: '强', color: '#52c41a' };
    return { level: 4, text: '很强', color: '#1890ff' };
  };

  const strength = getPasswordStrength(password);

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
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
          <SafetyOutlined style={{ marginRight: '8px' }} />
          密码生成器
        </Title>
        
        <Card style={{ marginBottom: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>生成的密码：</Text>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                <Input 
                  value={password}
                  readOnly
                  placeholder="点击生成密码按钮创建密码"
                  style={{ 
                    marginRight: '8px', 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '16px'
                  }}
                />
                <Button 
                  icon={<CopyOutlined />}
                  onClick={copyPassword}
                  disabled={!password}
                >
                  复制
                </Button>
              </div>
            </div>

            {password && (
              <div>
                <Text strong>密码强度：</Text>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>
                    {strength.text}
                  </span>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    marginTop: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(strength.level / 4) * 100}%`,
                      height: '100%',
                      backgroundColor: strength.color,
                      transition: 'all 0.3s'
                    }} />
                  </div>
                </div>
              </div>
            )}
          </Space>
        </Card>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card title="密码设置" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>密码长度：{length}</Text>
                  <Slider
                    min={4}
                    max={64}
                    value={length}
                    onChange={setLength}
                    marks={{
                      4: '4',
                      8: '8',
                      16: '16',
                      32: '32',
                      64: '64'
                    }}
                    style={{ marginTop: '16px' }}
                  />
                </div>

                <div>
                  <Text strong>字符类型：</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Space direction="vertical">
                      <Checkbox 
                        checked={includeUppercase}
                        onChange={(e) => setIncludeUppercase(e.target.checked)}
                      >
                        大写字母 (A-Z)
                      </Checkbox>
                      <Checkbox 
                        checked={includeLowercase}
                        onChange={(e) => setIncludeLowercase(e.target.checked)}
                      >
                        小写字母 (a-z)
                      </Checkbox>
                      <Checkbox 
                        checked={includeNumbers}
                        onChange={(e) => setIncludeNumbers(e.target.checked)}
                      >
                        数字 (0-9)
                      </Checkbox>
                      <Checkbox 
                        checked={includeSymbols}
                        onChange={(e) => setIncludeSymbols(e.target.checked)}
                      >
                        特殊符号 (!@#$%^&*)
                      </Checkbox>
                    </Space>
                  </div>
                </div>

                <div>
                  <Text strong>高级选项：</Text>
                  <div style={{ marginTop: '12px' }}>
                    <Checkbox 
                      checked={excludeSimilar}
                      onChange={(e) => setExcludeSimilar(e.target.checked)}
                    >
                      排除相似字符 (0, O, l, 1)
                    </Checkbox>
                  </div>
                </div>

                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={generatePassword}
                  size="large"
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  生成密码
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="密码安全建议">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ color: '#52c41a' }}>✓ 推荐做法：</Text>
                  <ul style={{ marginTop: '8px', marginBottom: '16px' }}>
                    <li>使用至少12位字符</li>
                    <li>包含大小写字母、数字和符号</li>
                    <li>每个账户使用不同密码</li>
                    <li>定期更换重要账户密码</li>
                    <li>使用密码管理器</li>
                  </ul>
                </div>

                <div>
                  <Text strong style={{ color: '#ff4d4f' }}>✗ 避免做法：</Text>
                  <ul style={{ marginTop: '8px', marginBottom: '16px' }}>
                    <li>使用个人信息（生日、姓名等）</li>
                    <li>使用常见密码（123456、password）</li>
                    <li>在多个网站使用相同密码</li>
                    <li>在公共场所输入密码</li>
                    <li>将密码保存在浏览器中</li>
                  </ul>
                </div>

                <div style={{ 
                  backgroundColor: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: '6px',
                  padding: '12px'
                }}>
                  <Text strong style={{ color: '#389e0d' }}>💡 安全提示</Text>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                    此工具完全在浏览器本地运行，生成的密码不会被发送到任何服务器。
                    建议将重要密码保存在安全的密码管理器中。
                  </p>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PasswordGenerator;
