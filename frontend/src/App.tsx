import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Home from './pages/Home';
import VideoToGif from './pages/VideoToGif';
import JsonFormatter from './pages/JsonFormatter';
import Base64Encode from './pages/Base64Encode';
import UrlEncode from './pages/UrlEncode';
import TimestampConvert from './pages/TimestampConvert';
import RegexTest from './pages/RegexTest';
import QrCodeGenerator from './pages/QrCodeGenerator';
import MarkdownPreview from './pages/MarkdownPreview';
import ColorTool from './pages/ColorTool';
import PasswordGenerator from './pages/PasswordGenerator';
import NotImplemented from './pages/NotImplemented';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools/video-to-gif" element={<VideoToGif />} />
            <Route path="/tools/json-formatter" element={<JsonFormatter />} />
            <Route path="/tools/base64-encode" element={<Base64Encode />} />
            <Route path="/tools/url-encode" element={<UrlEncode />} />
            <Route path="/tools/timestamp-convert" element={<TimestampConvert />} />
            <Route path="/tools/regex-test" element={<RegexTest />} />
            <Route path="/tools/qr-code-generator" element={<QrCodeGenerator />} />
            <Route path="/tools/markdown-preview" element={<MarkdownPreview />} />
            <Route path="/tools/color-tool" element={<ColorTool />} />
            <Route path="/tools/password-generator" element={<PasswordGenerator />} />
            <Route path="/tools/:toolId" element={<NotImplemented />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
