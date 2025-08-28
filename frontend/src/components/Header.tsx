import React, { useState, useEffect } from 'react';
import { Typography, Card } from 'antd';
import tugouImg from '../assets/tugou.png';
const { Title } = Typography;

interface ResponsiveConfig {
    windowWidth: number;
    isNarrow: boolean;
    isVerticalLayout: boolean;
    isSmallScreen: boolean;
    isWideScreen: boolean;
}

const useResponsiveConfig = (): ResponsiveConfig => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        windowWidth,
        isNarrow: windowWidth < 600,
        isVerticalLayout: windowWidth < 580,
        isSmallScreen: windowWidth < 768,
        isWideScreen: windowWidth > 1200,
    };
};

const TogoTitle: React.FC<{ config: ResponsiveConfig; style?: React.CSSProperties }> = ({ config, style }) => (
    <Title level={1} style={{
        color: 'white',
        fontSize: config.isSmallScreen ? '36px' : '48px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        margin: 0,
        ...style,
    }}>
        toGO
    </Title>
);

const DogIntroText:String = '它的 「高贵」从不在所谓「纯血认证」的稀缺性里，而在它与中国人生存共生的千年价值中。\n它是本土自然演化的「活文化符号」，承载着农耕文明里看家护院、协助生产的实用使命。\n无需精心喂养，却能强健生长；不必刻意训练，却懂护主守家，这份 “接地气” 的可靠，是许多人工选育犬种难及的。';

const DogIntroCard: React.FC<{ config: ResponsiveConfig; style?: React.CSSProperties }> = ({ config, style }) => (
    <Card
        style={{
            background: 'rgba(255,255,255,0.35)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            padding: config.isSmallScreen ? '12px' : '18px',
            marginRight: config.isVerticalLayout ? 0 : config.isWideScreen ? '100px' : config.isSmallScreen ? '30px' : '60px',
            maxHeight: '240px',
            width: config.isVerticalLayout ? '100%' : undefined,
            ...style,
        }}
        bodyStyle={{ display: 'flex', alignItems: 'flex-start', padding: 0 }}
    >
        <img 
            src={tugouImg} 
            alt="中华田园犬" 
            style={{ 
                width: config.isSmallScreen ? '80px' : '120px', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '8px', 
                marginRight: (config.isSmallScreen ? '12px' : '18px'),
                flexShrink: 0
            }} 
        />
        <div style={{ 
                fontSize: config.isSmallScreen ? '0.85rem' : '1rem', 
                color: '#333', 
                width: '100%', 
                height: '100%',
                minWidth: 0,
            }}>
                <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: config.isSmallScreen ? '1rem' : '1.2rem', 
                    marginTop: '8px',
                    marginBottom: '8px' 
                }}>
                    中华田园犬简介
                </div>
                <div style={{ 
                    lineHeight: 1.7, 
                    overflowWrap: 'break-word', 
                    height: '100%', 
                    display: '-webkit-box',
                    WebkitLineClamp: config.isSmallScreen ? 4 : 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'pre-line'
                }}>
                    <b>田园犬</b>
                    {'又名土狗、柴狗。' + DogIntroText}
                </div>
            </div>
    </Card>
);

const Header: React.FC = () => {
    const config = useResponsiveConfig();

    const containerStyle: React.CSSProperties = {
        width: '100%',
        minWidth: '320px',
        background: 'linear-gradient(155deg, #ffecd2ea 0%, #fcb69fea 30%, #ffddb1ea 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '16px 30px',
        zIndex: 1,
    };

    if (config.isVerticalLayout) {
        return (
            <div style={containerStyle}>
                <div style={{ width: '100%', textAlign: 'left', marginBottom: '16px' }}>
                    <TogoTitle config={config} />
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                    <DogIntroCard config={config} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ 
                    flexShrink: 0,
                    width: 'fit-content',
                    paddingRight: '20px'
                }}>
                    <TogoTitle config={config} style={{ textAlign: 'left' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
                    <DogIntroCard config={config} />
                </div>
            </div>
        </div>
    );
};

export default Header;
