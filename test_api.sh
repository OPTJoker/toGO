#!/bin/bash

echo "测试视频转GIF API..."

# 检查是否有测试视频文件
if [ ! -f "test_video.mp4" ]; then
    echo "创建一个简单的测试视频..."
    # 使用FFmpeg创建一个简单的测试视频 (5秒，红色背景)
    ffmpeg -f lavfi -i color=red:size=320x240:duration=5 -y test_video.mp4
fi

echo "测试API调用..."
curl -X POST http://localhost:8080/api/video/to-gif \
  -F "video=@test_video.mp4" \
  -F "startTime=0" \
  -F "duration=3" \
  -F "width=320" \
  -F "quality=medium" \
  -v

echo -e "\n\n检查生成的GIF文件..."
ls -la ../backend/output/*.gif | tail -1

echo -e "\n验证最新生成的GIF文件..."
LATEST_GIF=$(ls -t ../backend/output/*.gif | head -1)
if [ -f "$LATEST_GIF" ]; then
    echo "文件存在: $LATEST_GIF"
    file "$LATEST_GIF"
    echo "文件大小: $(du -h "$LATEST_GIF" | cut -f1)"
else
    echo "没有找到GIF文件"
fi
