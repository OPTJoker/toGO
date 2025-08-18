# Ubuntu 24.04 部署说明

## 🎯 针对你的问题的解决方案

你遇到的 `go: command not found` 问题是因为在Ubuntu 24.04中，环境变量在脚本中的设置方式有所不同。

## 🚀 新的部署方法

我为你创建了专门针对Ubuntu 24.04的部署脚本：

### 第1步：上传代码
```bash
# 在你的Mac上执行
scp -r toGO/ root@101.126.6.243:/root/
```

### 第2步：登录并部署
```bash
# 登录云服务器
ssh root@101.126.6.243

# 进入项目目录
cd /root/toGO

# 使用Ubuntu 24.04专用脚本
chmod +x deploy-ubuntu24.sh
./deploy-ubuntu24.sh
```

## 🔧 这个脚本解决了什么问题？

1. **Go环境变量问题** - 使用绝对路径 `/usr/local/go/bin/go` 来执行Go命令
2. **Ubuntu 24.04兼容性** - 针对最新版Ubuntu优化了安装流程
3. **PATH设置问题** - 直接在当前shell中设置PATH，不依赖source命令
4. **更好的错误检测** - 每一步都有详细的验证和错误提示

## 📋 脚本执行流程

1. ✅ 安装Go 1.21.6（使用绝对路径）
2. ✅ 安装Node.js 18
3. ✅ 安装Nginx和FFmpeg  
4. ✅ 构建后端（使用/usr/local/go/bin/go）
5. ✅ 构建前端
6. ✅ 配置Nginx反向代理
7. ✅ 创建systemd服务
8. ✅ 启动所有服务
9. ✅ 验证部署状态

## 🔍 如果还有问题

如果还遇到问题，可以手动检查：

```bash
# 检查Go是否正确安装
ls -la /usr/local/go/bin/

# 手动测试Go
/usr/local/go/bin/go version

# 检查环境变量
echo $PATH

# 查看服务状态
sudo systemctl status togo-backend
```

## 💡 主要改进

- 使用 `/usr/local/go/bin/go` 绝对路径而不是依赖PATH
- 针对Ubuntu 24.04优化了环境变量设置
- 更详细的错误检测和日志输出
- 每一步都有验证机制

现在试试新的 `deploy-ubuntu24.sh` 脚本吧！🚀
