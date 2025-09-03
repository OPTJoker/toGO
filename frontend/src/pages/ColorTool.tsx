import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Space, Row, Col, Typography, ColorPicker, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
}

const ColorTool: React.FC = () => {
  const [color, setColor] = useState('#ff6b35');
  const [colorInfo, setColorInfo] = useState<ColorInfo>({
    hex: '#ff6b35',
    rgb: 'rgb(255, 107, 53)',
    hsl: 'hsl(12, 100%, 60%)',
    hsv: 'hsv(12, 79%, 100%)',
    cmyk: 'cmyk(0%, 58%, 79%, 0%)'
  });

  // 颜色转换函数
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max;

    const d = max - min;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    };
  };

  const rgbToCmyk = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const k = 1 - Math.max(r, Math.max(g, b));
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  };

  const updateColorInfo = (hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    setColorInfo({
      hex: hexColor.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
    });
  };

  useEffect(() => {
    updateColorInfo(color);
  }, [color, updateColorInfo]);

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${format} 格式已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const generateRandomColor = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setColor(randomColor);
  };

  const presetColors = [
    '#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#bae637',
    '#73d13d', '#36cfc9', '#40a9ff', '#597ef7', '#9254de',
    '#f759ab', '#ff85c0', '#ffc069', '#fff566', '#95de64',
    '#5cdbd3', '#69c0ff', '#85a5ff', '#b37feb', '#ffadd2'
  ];

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
          颜色工具
        </Title>
        
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="颜色选择" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div 
                    style={{ 
                      width: '200px', 
                      height: '200px', 
                      backgroundColor: color,
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <ColorPicker
                    value={color}
                    onChange={(value) => setColor(value.toHexString())}
                    size="large"
                    showText
                  />
                </div>

                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="输入颜色值，如 #ff6b35"
                  prefix="#"
                />

                <Button 
                  type="primary" 
                  icon={<SwapOutlined />}
                  onClick={generateRandomColor}
                  block
                >
                  生成随机颜色
                </Button>
              </Space>
            </Card>

            <Card title="预设颜色">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {presetColors.map((presetColor, index) => (
                  <div
                    key={index}
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: presetColor,
                      border: color === presetColor ? '3px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setColor(presetColor)}
                    title={presetColor}
                  />
                ))}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="颜色信息">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>HEX:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Input 
                      value={colorInfo.hex} 
                      readOnly 
                      style={{ marginRight: '8px' }}
                    />
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(colorInfo.hex, 'HEX')}
                    />
                  </div>
                </div>

                <div>
                  <Text strong>RGB:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Input 
                      value={colorInfo.rgb} 
                      readOnly 
                      style={{ marginRight: '8px' }}
                    />
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(colorInfo.rgb, 'RGB')}
                    />
                  </div>
                </div>

                <div>
                  <Text strong>HSL:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Input 
                      value={colorInfo.hsl} 
                      readOnly 
                      style={{ marginRight: '8px' }}
                    />
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(colorInfo.hsl, 'HSL')}
                    />
                  </div>
                </div>

                <div>
                  <Text strong>HSV:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Input 
                      value={colorInfo.hsv} 
                      readOnly 
                      style={{ marginRight: '8px' }}
                    />
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(colorInfo.hsv, 'HSV')}
                    />
                  </div>
                </div>

                <div>
                  <Text strong>CMYK:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <Input 
                      value={colorInfo.cmyk} 
                      readOnly 
                      style={{ marginRight: '8px' }}
                    />
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(colorInfo.cmyk, 'CMYK')}
                    />
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="使用说明" style={{ marginTop: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div>
                <Text strong>支持的颜色格式：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li><strong>HEX:</strong> 十六进制颜色值，如 #FF6B35</li>
                  <li><strong>RGB:</strong> 红绿蓝颜色值，如 rgb(255, 107, 53)</li>
                  <li><strong>HSL:</strong> 色调、饱和度、亮度，如 hsl(12, 100%, 60%)</li>
                  <li><strong>HSV:</strong> 色调、饱和度、明度，如 hsv(12, 79%, 100%)</li>
                  <li><strong>CMYK:</strong> 青、品红、黄、黑，如 cmyk(0%, 58%, 79%, 0%)</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text strong>主要功能：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>实时颜色预览</li>
                  <li>多种颜色格式转换</li>
                  <li>一键复制颜色值</li>
                  <li>随机颜色生成</li>
                  <li>预设颜色快速选择</li>
                  <li>支持手动输入颜色值</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ColorTool;
