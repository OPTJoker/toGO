import React from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import * as Icons from '@ant-design/icons';
import { tools, categories } from '../data/tools';
import type { Tool } from '../types';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleToolClick = (tool: Tool) => {
    if (tool.implemented) {
      navigate(tool.path);
    } else {
      navigate(`/tools/${tool.id}`);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon style={{ fontSize: '28px', color: '#495057' }} /> : null;
  };

  const renderToolsByCategory = () => {
    return categories.map(category => {
      const categoryTools = tools.filter(tool => tool.category.id === category.id);
      
      return (
        <div key={category.id} style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ 
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>
            {category.name}
          </Title>
          <div className="tools-grid">
            {categoryTools.map(tool => (
              <div key={tool.id}>
                  <Card
                    hoverable
                    style={{ 
                      height: '200px',
                      cursor: tool.implemented ? 'pointer' : 'not-allowed',
                      opacity: tool.implemented ? 1 : 0.7,
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: tool.implemented 
                        ? '0 8px 24px rgba(0,0,0,0.12)' 
                        : '0 4px 12px rgba(0,0,0,0.08)',
                      background: tool.implemented 
                        ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        : '#f8f9fa',
                      transition: 'all 0.3s ease',
                      transform: tool.implemented ? 'translateY(0)' : 'none'
                    }}
                    onClick={() => handleToolClick(tool)}
                    styles={{
                      body: {
                        padding: '24px', 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'transparent'
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (tool.implemented) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tool.implemented) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                      }
                    }}
                  >
                  <Space direction="vertical" style={{ width: '100%', height: '100%', textAlign: 'center' }}>
                    <div style={{ 
                      background: `linear-gradient(135deg, ${tool.category.color}20, ${tool.category.color}10)`,
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      {getIcon(tool.icon)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Title level={4} style={{ 
                        margin: '0 0 8px 0',
                        color: '#2c3e50',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {tool.name}
                        {tool.implemented && (
                          <Tag color="green" style={{ 
                            marginLeft: '8px', 
                            fontSize: '10px',
                            borderRadius: '12px',
                            border: 'none'
                          }}>
                            已实现
                          </Tag>
                        )}
                      </Title>
                      <Paragraph 
                        style={{ 
                          margin: 0, 
                          fontSize: '13px', 
                          color: '#6c757d',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {tool.description}
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0',
      margin: '0',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      {/* 顶部标题区域 */}
      <div style={{ 
        textAlign: 'center', 
        paddingTop: '40px',
        paddingBottom: '40px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Title level={1} style={{ 
          color: 'white', 
          fontSize: '36px', 
          fontWeight: 'bold',
          marginBottom: '12px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          开发者工具箱
        </Title>
        <Paragraph style={{ 
          fontSize: '18px', 
          color: 'rgba(255, 255, 255, 0.9)',
          maxWidth: '600px',
          margin: '0 auto',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          为开发者精心打造的实用工具集合，提升您的工作效率
        </Paragraph>
      </div>
      
      {/* 工具展示区域 */}
      <div style={{ 
        padding: '24px 16px',
        background: 'rgba(255, 255, 255, 0.95)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          {renderToolsByCategory()}
        </div>
      </div>
    </div>
  );
};

export default Home;
