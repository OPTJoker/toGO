import React from 'react';
import { Layout as AntLayout, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 判断是否在子页面
  const isSubPage = location.pathname !== '/';
  
  // 获取上个页面的标题（导航逻辑：显示来源页面标题）
  // const getParentPageTitle = () => {
  //   // 所有工具页面都是从首页进入的，所以显示首页标题
  //   return '首页';
  // };

  return (
    <AntLayout style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {isSubPage && (
        <Header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1001,
          width: '100%',
          height: '64px',
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffdde1 100%)', // 马卡龙暖色调
          boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          backdropFilter: 'blur(10px)',
          borderBottom: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              onClick={() => navigate('/')}
              style={{
                color: '#ff7e5f', // 马卡龙橙色
                fontSize: '18px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0 16px',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                background: 'transparent',
                boxShadow: '0 2px 8px rgba(252,182,159,0.12)',
                border: '1px solid #fcb69f',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#ff7e5f';
                e.currentTarget.style.border = '1px solid #ff7e5f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#ff7e5f';
                e.currentTarget.style.border = '1px solid #fcb69f';
              }}
            >
              <ArrowLeftOutlined style={{ color: '#ff7e5f', fontSize: '20px' }} />
              
            </div>
            <Title level={3} style={{ 
              margin: 0, 
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}>
              {/* {getParentPageTitle()} */}
            </Title>
          </div>
        </Header>
      )}
      
      <Content style={{ 
        marginTop: isSubPage ? '64px' : '0',
        width: '100vw',
        maxWidth: '100vw',
        minHeight: isSubPage ? 'calc(100vh - 64px)' : '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}>
        {children}
      </Content>
    </AntLayout>
  );
};

export default Layout;
