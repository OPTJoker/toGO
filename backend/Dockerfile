# 使用阿里云Go镜像作为构建环境
FROM registry.cn-hangzhou.aliyuncs.com/dockerhub-mirror/golang:1.21-alpine AS builder

# 安装FFmpeg
RUN apk add --no-cache ffmpeg

# 设置工作目录
WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 使用alpine作为运行环境
FROM alpine:latest

# 安装FFmpeg和必要的工具
RUN apk --no-cache add ffmpeg ca-certificates

# 设置工作目录
WORKDIR /root/

# 从构建阶段复制可执行文件
COPY --from=builder /app/main .

# 创建必要的目录
RUN mkdir -p uploads output

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["./main"]
