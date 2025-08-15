import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { tools } from '../data/tools';

const { Title, Paragraph } = Typography;

const NotImplemented: React.FC = () => {
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId: string }>();
  
  const tool = tools.find(t => t.id === toolId);

  return (
    <div style={{ maxWidth: '95vw', margin: '0 auto', padding: '48px 0', width: '100%' }}>
      {/* 顶部导航区域 */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '24px', 
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '6px',
        padding: '4px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          type="text"
          size="small"
        >
          返回首页
        </Button>
      </div>
      
      <Card style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ToolOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
          
          <div>
            <Title level={2}>功能开发中</Title>
            <Paragraph style={{ fontSize: '16px', color: '#666' }}>
              {tool ? `"${tool.name}"` : '该功能'} 正在紧急开发中，敬请期待！
            </Paragraph>
            {tool && (
              <Paragraph style={{ color: '#999' }}>
                {tool.description}
              </Paragraph>
            )}
          </div>
          
          <div>
            <Paragraph style={{ color: '#999', marginBottom: '24px' }}>
              目前只有 <strong>视频转GIF</strong> 功能已完成开发，
              <br />
              其他工具正在陆续完善中...
            </Paragraph>
            
            <Space>
              <Button onClick={() => navigate('/')}>
                返回首页
              </Button>
              <Button 
                type="primary" 
                onClick={() => navigate('/tools/video-to-gif')}
              >
                体验视频转GIF
              </Button>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default NotImplemented;
