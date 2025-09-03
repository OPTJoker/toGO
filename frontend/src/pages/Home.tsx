import React, { useEffect, useState, useRef } from 'react';
import { Card, Typography, Space } from 'antd';
import Header from '../components/Header';
import * as Icons from '@ant-design/icons';
import { tools, categories } from '../data/tools';
import type { Tool, VisitorStats } from '../types';
import { statsApi } from '../api';
import homeBgBanner from '../assets/home-bg-banner.jpg';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false); // 添加记录状态
  const [floatPosition, setFloatPosition] = useState({ x: window.innerWidth - 180, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const floatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 记录访问并获取统计数据
    const recordAndGetStats = async () => {
      setIsLoading(true);
      try {
        // 记录当前访问
        await statsApi.recordVisitor();
        setHasRecorded(true); // 标记已记录
        
        // 获取统计数据
        const [stats, total] = await Promise.all([
          statsApi.getVisitorStats(),
          statsApi.getTotalVisitors()
        ]);
        
        setVisitorStats(stats);
        setTotalVisitors(total);
      } catch (error) {
        console.error('获取访问统计失败:', error);
        // 无论成功还是失败都标记为已记录，避免重复请求
        setHasRecorded(true);
        
        // 如果是网络错误或服务不可用，不要重试
        if (error instanceof Error && error.message.includes('500')) {
          console.log('服务器内部错误，跳过统计功能');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // 防止重复调用
    if (hasRecorded || isLoading) {
      return;
    }

    // 添加延迟，避免组件快速重新挂载时的重复调用
    const timer = setTimeout(() => {
      recordAndGetStats();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [hasRecorded, isLoading]); // 添加依赖项

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    // 拖拽中
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setFloatPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    // 拖拽结束
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // 自动吸附到左边或右边，增加边距
        const windowWidth = window.innerWidth;
        const floatWidth = floatRef.current?.offsetWidth || 180; // 动态获取浮窗宽度
        const margin = 20; // 边距
        const isLeftSide = floatPosition.x < windowWidth / 2;
        setFloatPosition(prev => ({
          ...prev,
          x: isLeftSide ? margin : windowWidth - floatWidth - margin
        }));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, floatPosition.x]);

  const handleToolClick = (tool: Tool) => {
    if (tool.implemented) {
      window.open(tool.path, '_blank');
    } else {
      window.open(`/tools/${tool.id}`, '_blank');
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as unknown as Record<string, React.ComponentType<any>>)[iconName];
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

  const renderBeiAn = () => {
    const beianCode = "110xxxyyyyzzzz"; //todo: 替换为真实的备案号
    const beianHref = `https://beian.mps.gov.cn/#/query/webSearch?code=${beianCode}`;
    const beianICP = "京ICP备2025141417号";
    const beianICPHref = "https://beian.miit.gov.cn/";
    return (
      <div style={{ width: '100%', textAlign: 'center', marginTop: 80, marginBottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src="https://portal.volccdn.com/obj/volcfe/footer/national_emblem.png" alt="警徽" style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: 4 }} />
            <a href={beianHref}>
              <span style={{ color: '#888', fontSize: 13, verticalAlign: 'middle', marginRight: 4 }}>京公网安备{beianCode}号</span>
            </a>
            <a href={beianICPHref}>
              <span style={{ color: '#888', fontSize: 13, verticalAlign: 'middle', marginLeft: 16 }}>{beianICP}</span>
            </a>
          </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      position: 'relative',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      overflowY: 'auto',
    }}>
      {/* 顶部紫色标题栏区域，仅此处加背景图 */}
      <div style={{
        width: '100%',
        minHeight: '120px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            backgroundImage: 'url(' + homeBgBanner + ')',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.99,
            pointerEvents: 'none',
        }} />

        <Header />
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
          {renderBeiAn()}
        </div>
      </div>
      
      {/* 访问统计显示 */}
      {(visitorStats || isLoading) && (
        <div 
          ref={floatRef}
          style={{
            position: 'fixed',
            left: `${floatPosition.x}px`,
            top: `${floatPosition.y}px`,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '12px 16px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            color: '#666',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            maxWidth: `${window.innerWidth * 0.9}px`,
            whiteSpace: 'nowrap',
            transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseDown={handleMouseDown}
        >
          {isLoading ? (
            <div>加载统计中...</div>
          ) : visitorStats ? (
            <>
              <div style={{ marginBottom: '4px' }}>
                今日服务: {visitorStats.todayVisitors}人
              </div>
              <div>
                累计: {totalVisitors} 人
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Home;
