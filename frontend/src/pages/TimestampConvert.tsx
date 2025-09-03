import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, message, Row, Col, Typography, Select, Divider, DatePicker } from 'antd';
import { 
  ClockCircleOutlined, 
  CalendarOutlined, 
  CopyOutlined, 
  ClearOutlined,
  CheckOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const TimestampConvert: React.FC = () => {
  const [timestamp, setTimestamp] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [timestampUnit, setTimestampUnit] = useState<'seconds' | 'milliseconds'>('seconds');
  const [copied, setCopied] = useState('');

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 时间戳转日期
  const timestampToDate = () => {
    try {
      if (!timestamp.trim()) {
        message.warning('请输入时间戳');
        return null;
      }

      const ts = parseInt(timestamp);
      if (isNaN(ts)) {
        message.error('时间戳格式错误，请输入数字');
        return null;
      }

      // 根据单位处理时间戳
      const momentDate = timestampUnit === 'seconds' ? dayjs.unix(ts) : dayjs(ts);
      
      if (!momentDate.isValid()) {
        message.error('无效的时间戳');
        return null;
      }

      setSelectedDate(momentDate);
      message.success('时间戳转换成功');
      return momentDate;
    } catch (_error) {
      message.error('转换失败，请检查时间戳格式');
      console.error('Timestamp convert error:', _error);
      return null;
    }
  };

  // 日期转时间戳
  const dateToTimestamp = () => {
    try {
      if (!selectedDate) {
        message.warning('请选择日期时间');
        return '';
      }

      const ts = timestampUnit === 'seconds' 
        ? selectedDate.unix().toString()
        : selectedDate.valueOf().toString();
      
      setTimestamp(ts);
      message.success('日期转换成功');
      return ts;
    } catch (_error) {
      message.error('转换失败');
      console.error('Date convert error:', _error);
      return '';
    }
  };

  // 获取当前时间戳
  const getCurrentTimestamp = () => {
    const ts = timestampUnit === 'seconds' 
      ? currentTime.unix().toString()
      : currentTime.valueOf().toString();
    
    setTimestamp(ts);
    setSelectedDate(currentTime);
    message.success('已获取当前时间戳');
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (!text) {
        message.warning('没有可复制的内容');
        return;
      }
      
      await navigator.clipboard.writeText(text);
      setCopied(type);
      message.success('已复制到剪贴板');
      
      // 3秒后重置复制状态
      setTimeout(() => setCopied(''), 3000);
    } catch (_error) {
      message.error('复制失败，请手动复制');
    }
  };

  // 清空内容
  const clearAll = () => {
    setTimestamp('');
    setSelectedDate(null);
    setCopied('');
    message.info('已清空所有内容');
  };

  // 批量转换时间戳
  const batchConvert = () => {
    try {
      if (!timestamp.trim()) {
        message.warning('请输入时间戳列表');
        return;
      }

      const timestamps = timestamp.split('\n').filter(line => line.trim());
      const results: string[] = [];

      timestamps.forEach((ts, index) => {
        try {
          const num = parseInt(ts.trim());
          if (isNaN(num)) {
            results.push(`第${index + 1}行: 格式错误 - ${ts}`);
            return;
          }

          const date = timestampUnit === 'seconds' ? dayjs.unix(num) : dayjs(num);
          if (date.isValid()) {
            results.push(`${ts} => ${date.format('YYYY-MM-DD HH:mm:ss')}`);
          } else {
            results.push(`第${index + 1}行: 无效时间戳 - ${ts}`);
          }
        } catch {
          results.push(`第${index + 1}行: 转换失败 - ${ts}`);
        }
      });

      // 在新窗口显示结果
      const resultWindow = window.open('', '_blank');
      if (resultWindow) {
        resultWindow.document.write(`
          <html>
            <head><title>批量时间戳转换结果</title></head>
            <body style="font-family: monospace; padding: 20px;">
              <h3>批量转换结果</h3>
              <pre>${results.join('\n')}</pre>
            </body>
          </html>
        `);
      }

      message.success(`批量转换完成，共处理${timestamps.length}个时间戳`);
    } catch (_error) {
      message.error('批量转换失败');
      console.error('Batch convert error:', _error);
    }
  };

  // 格式化显示的日期时间信息
  const getFormattedInfo = () => {
    if (!selectedDate || !selectedDate.isValid()) return null;

    return {
      iso: selectedDate.toISOString(),
      local: selectedDate.format('YYYY-MM-DD HH:mm:ss'),
      utc: selectedDate.add(-selectedDate.utcOffset(), 'minute').format('YYYY-MM-DD HH:mm:ss'),
      relative: `${Math.abs(selectedDate.diff(dayjs(), 'day'))}天${selectedDate.isBefore(dayjs()) ? '前' : '后'}`,
      dayOfWeek: selectedDate.format('dddd'),
      dayOfYear: selectedDate.format('DDD'),
      weekOfYear: selectedDate.format('w'),
      quarter: `Q${Math.ceil((selectedDate.month() + 1) / 3)}`,
    };
  };

  const formatInfo = getFormattedInfo();

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
              <ClockCircleOutlined />
              <span>时间戳转换工具</span>
            </Space>
          }
          extra={
            <Space>
              <span style={{ fontSize: '12px', color: '#666' }}>
                当前时间: {currentTime.format('YYYY-MM-DD HH:mm:ss')}
              </span>
              <Button 
                type="primary" 
                size="small"
                icon={<ReloadOutlined />}
                onClick={getCurrentTimestamp}
              >
                获取当前时间戳
              </Button>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          {/* 时间戳单位选择 */}
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <span>时间戳单位：</span>
              <Select 
                value={timestampUnit} 
                onChange={setTimestampUnit}
                style={{ width: 120 }}
              >
                <Option value="seconds">秒 (10位)</Option>
                <Option value="milliseconds">毫秒 (13位)</Option>
              </Select>
            </Space>
          </div>

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title="时间戳 ⇒ 日期时间"
                style={{ marginBottom: '16px' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    placeholder={`请输入${timestampUnit === 'seconds' ? '10位' : '13位'}时间戳...`}
                    style={{ 
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                      fontSize: '13px'
                    }}
                  />
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<CalendarOutlined />}
                      onClick={timestampToDate}
                    >
                      转换为日期
                    </Button>
                    <Button onClick={batchConvert}>
                      批量转换
                    </Button>
                    <Button 
                      type="text" 
                      size="small"
                      icon={copied === 'timestamp' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyToClipboard(timestamp, 'timestamp')}
                      style={{ color: copied === 'timestamp' ? '#52c41a' : undefined }}
                    >
                      复制时间戳
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                size="small" 
                title="日期时间 ⇒ 时间戳"
                style={{ marginBottom: '16px' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <DatePicker
                    showTime
                    value={selectedDate}
                    onChange={setSelectedDate}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder="选择日期时间"
                  />
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<ClockCircleOutlined />}
                      onClick={dateToTimestamp}
                    >
                      转换为时间戳
                    </Button>
                    <Button 
                      type="text" 
                      size="small"
                      icon={copied === 'date' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyToClipboard(
                        selectedDate ? selectedDate.format('YYYY-MM-DD HH:mm:ss') : '', 
                        'date'
                      )}
                      style={{ color: copied === 'date' ? '#52c41a' : undefined }}
                    >
                      复制日期
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* 详细信息显示 */}
          {formatInfo && (
            <Card 
              size="small" 
              title="详细信息"
              extra={
                <Button 
                  danger
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearAll}
                >
                  清空
                </Button>
              }
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12} md={8}>
                  <strong>本地时间：</strong><br />
                  <code>{formatInfo.local}</code>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <strong>UTC时间：</strong><br />
                  <code>{formatInfo.utc}</code>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <strong>ISO格式：</strong><br />
                  <code style={{ fontSize: '11px' }}>{formatInfo.iso}</code>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <strong>相对时间：</strong><br />
                  <code>{formatInfo.relative}</code>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <strong>星期：</strong><br />
                  <code>{formatInfo.dayOfWeek}</code>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <strong>第几天/季度：</strong><br />
                  <code>第{formatInfo.dayOfYear}天 / Q{formatInfo.quarter}</code>
                </Col>
              </Row>
            </Card>
          )}

          <Divider />
          
          <div style={{ color: '#666', fontSize: '14px' }}>
            <Title level={5}>使用说明：</Title>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>时间戳转日期：</strong>输入10位(秒)或13位(毫秒)时间戳，转换为可读日期</li>
              <li><strong>日期转时间戳：</strong>选择日期时间，转换为时间戳格式</li>
              <li><strong>当前时间：</strong>快速获取当前时间戳</li>
              <li><strong>批量转换：</strong>支持多行时间戳批量转换</li>
              <li><strong>多格式支持：</strong>显示本地时间、UTC时间、ISO格式等</li>
              <li>时间戳常用于数据库存储、API接口、日志记录等场景</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TimestampConvert;
