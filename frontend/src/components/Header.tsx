import React from 'react';
import { Row, Col, Typography, Card } from 'antd';
import tugouImg from '../assets/tugou.png';
const { Title } = Typography;

const Header: React.FC = () => {
    return (
        <div style={{
            width: '100%',
            background: 'linear-gradient(155deg, #ffecd2ea 0%, #fcb69fea 30%, #ffddb1ea 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '16px 30px',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
            justifyContent: 'center',
        }}>
            <Row style={{ width: '100%' }} justify="start">
                <Col flex="320px">
                    <Title level={1} style={{
                        color: 'white',
                        fontSize: '48px',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        margin: 0,
                        textAlign: 'left',
                        height: '100%'
                    }}>
                        toGO
                    </Title>
                </Col>
                <Col flex="1">
                    <Card
                        style={{
                            background: 'rgba(255,255,255,0.35)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '18px 24px',
                            maxWidth: '1000px',
                            maxHeight: '240px',
                            // width: '100%',
                            marginLeft: '0px',
                        }}
                        bodyStyle={{ display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                        <img src={tugouImg} alt="中华田园犬" style={{ width: '120px', height: '100%', objectFit: 'cover', borderRadius: '8px', marginRight: '18px' }} />
                        <div style={{ fontSize: '1rem', color: '#333', width: '100%', height: '100%'}}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px' }}>中华田园犬简介</div>
                            <div style={{ lineHeight: 1.7, overflowWrap: 'break-word' , height: '100%', display: '-webkit-box'}}>
                                <b>中华田园犬</b>（学名：Canis lupus familiaris），又名土狗、柴狗，是中国本土犬种之一。性格温顺忠诚，适应力强。中华田园犬是中国汉族几千年农耕社会背景下的产物，被誉为“人类最忠实的朋友”。<br />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
  );
};

export default Header;
