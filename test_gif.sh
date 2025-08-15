#!/bin/bash

# 测试生成的GIF文件的有效性
OUTPUT_DIR="/Users/sharon/Desktop/toGif/backend/output"

echo "=== 检查输出目录中的GIF文件 ==="
ls -la "$OUTPUT_DIR"/*.gif 2>/dev/null

echo ""
echo "=== 检查最新的GIF文件详情 ==="
LATEST_GIF=$(ls -t "$OUTPUT_DIR"/*.gif 2>/dev/null | head -1)

if [ -n "$LATEST_GIF" ]; then
    echo "最新GIF文件: $LATEST_GIF"
    echo "文件大小: $(du -h "$LATEST_GIF" | cut -f1)"
    echo ""
    
    # 使用file命令检查文件类型
    echo "=== 文件类型检查 ==="
    file "$LATEST_GIF"
    echo ""
    
    # 使用FFprobe检查GIF信息
    echo "=== FFprobe 信息 ==="
    ffprobe -v quiet -print_format json -show_format -show_streams "$LATEST_GIF" 2>/dev/null || echo "FFprobe 检查失败"
    echo ""
    
    # 检查文件头
    echo "=== 文件头检查 ==="
    xxd -l 16 "$LATEST_GIF"
    echo ""
    
    # 尝试用imagemagick检查
    echo "=== ImageMagick 检查 ==="
    identify "$LATEST_GIF" 2>/dev/null || echo "ImageMagick 检查失败"
    
else
    echo "没有找到GIF文件"
fi
