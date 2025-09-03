import React, { useState, useEffect } from 'react';
import { Card, Input, Row, Col, Typography, Button, Space, message } from 'antd';
import { CopyOutlined, DownloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const MarkdownPreview: React.FC = () => {
  const [markdown, setMarkdown] = useState(`# Markdown 预览器

## 二级标题

这是一个 **Markdown** 预览工具，支持实时预览。

### 三级标题

- 列表项 1
- 列表项 2
- 列表项 3

#### 代码示例

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

#### 表格示例

| 姓名 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |

#### 链接和图片

[访问 GitHub](https://github.com)

> 这是一个引用块
> 可以包含多行内容

#### 其他格式

- **粗体文本**
- *斜体文本*
- ~~删除线~~
- \`行内代码\`

---

支持的 Markdown 语法包括标题、列表、代码块、表格、链接、图片、引用等。`);
  
  const [preview, setPreview] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'edit'>('split');

  // 简单的 Markdown 转 HTML 函数
  const markdownToHtml = (md: string): string => {
    let html = md;

    // 代码块
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 标题
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    
    // 粗体和斜体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 删除线
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />');
    
    // 引用块
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // 水平线
    html = html.replace(/^---$/gim, '<hr>');
    
    // 无序列表
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 有序列表
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    
    // 表格
    const tableRegex = /(\|.*\|.*\n)+/g;
    html = html.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      const headers = lines[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
      const rows = lines.slice(2);
      
      let table = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">';
      table += '<thead><tr>';
      headers.forEach(header => {
        table += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">${header}</th>`;
      });
      table += '</tr></thead><tbody>';
      
      rows.forEach(row => {
        const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
        table += '<tr>';
        cells.forEach(cell => {
          table += `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`;
        });
        table += '</tr>';
      });
      
      table += '</tbody></table>';
      return table;
    });
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // 换行
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  useEffect(() => {
    const htmlContent = markdownToHtml(markdown);
    setPreview(htmlContent);
  }, [markdown]);

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      message.success('Markdown 内容已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const copyHtml = () => {
    navigator.clipboard.writeText(preview).then(() => {
      message.success('HTML 内容已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
    code { background-color: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
    pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #dfe2e5; padding-left: 16px; color: #6a737d; margin: 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    img { max-width: 100%; height: auto; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${preview}
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.html';
    link.click();
    URL.revokeObjectURL(url);
  };

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
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            Markdown 预览器
          </Title>
          
          <Space>
            <Button.Group>
              <Button 
                type={viewMode === 'edit' ? 'primary' : 'default'}
                icon={<EditOutlined />}
                onClick={() => setViewMode('edit')}
              >
                编辑
              </Button>
              <Button 
                type={viewMode === 'split' ? 'primary' : 'default'}
                onClick={() => setViewMode('split')}
              >
                分屏
              </Button>
              <Button 
                type={viewMode === 'preview' ? 'primary' : 'default'}
                icon={<EyeOutlined />}
                onClick={() => setViewMode('preview')}
              >
                预览
              </Button>
            </Button.Group>
            
            <Button icon={<CopyOutlined />} onClick={copyMarkdown}>
              复制 Markdown
            </Button>
            <Button icon={<CopyOutlined />} onClick={copyHtml}>
              复制 HTML
            </Button>
            <Button icon={<DownloadOutlined />} onClick={downloadMarkdown}>
              下载 MD
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={downloadHtml}>
              下载 HTML
            </Button>
          </Space>
        </div>
        
        <Row gutter={16} style={{ height: 'calc(100vh - 160px)' }}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <Col span={viewMode === 'split' ? 12 : 24}>
              <Card 
                title="Markdown 编辑器" 
                style={{ height: '100%' }}
                bodyStyle={{ padding: 0, height: 'calc(100% - 56px)' }}
              >
                <TextArea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="在此输入 Markdown 内容..."
                  style={{ 
                    height: '100%', 
                    border: 'none', 
                    resize: 'none',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
                  }}
                />
              </Card>
            </Col>
          )}
          
          {(viewMode === 'preview' || viewMode === 'split') && (
            <Col span={viewMode === 'split' ? 12 : 24}>
              <Card 
                title="预览结果" 
                style={{ height: '100%' }}
                bodyStyle={{ padding: '16px', height: 'calc(100% - 56px)', overflow: 'auto' }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: preview }}
                  style={{
                    lineHeight: '1.6',
                    color: '#333'
                  }}
                />
              </Card>
            </Col>
          )}
        </Row>

        <Card title="使用说明" style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div>
                <Text strong>支持的语法：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li># 标题 (H1-H6)</li>
                  <li>**粗体** 和 *斜体*</li>
                  <li>~~删除线~~</li>
                  <li>`行内代码` 和 ```代码块```</li>
                  <li>[链接](url) 和 ![图片](url)</li>
                  <li>- 无序列表</li>
                  <li>1. 有序列表</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div>
                <Text strong>高级功能：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>| 表格 | 支持 |</li>
                  <li>&gt; 引用块</li>
                  <li>--- 水平分割线</li>
                  <li>实时预览</li>
                  <li>导出 Markdown 和 HTML</li>
                  <li>多种视图模式</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default MarkdownPreview;
