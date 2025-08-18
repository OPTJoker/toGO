# toGO 生产环境配置文档

## 针对服务器配置优化 (4核8G + 40GB SSD + 4Mbps)

### 🎯 优化重点

1. **带宽优化**
   - 文件上传限制：50MB (适配4Mbps上传)
   - Gzip压缩：减少传输数据量
   - 静态资源缓存：减少重复传输

2. **存储优化**
   - 自动清理：24小时清理上传文件，12小时清理输出文件
   - 手动清理：系统监控页面一键清理
   - 存储监控：实时显示磁盘使用情况

3. **性能优化**
   - 容器资源限制：防止资源耗尽
   - 交换分区：2GB交换分区应对内存不足
   - 内核参数：优化网络和内存管理

### 📊 资源配置

```yaml
# Docker Compose 资源限制
frontend:
  memory: 512M (limit) / 256M (reservation)

backend:
  memory: 2G (limit) / 1G (reservation)
  cpu: 2.0 (limit) / 1.0 (reservation)
```

### 🔧 部署步骤

1. **快速部署**
   ```bash
   wget https://raw.githubusercontent.com/OPTJoker/toGO/main/deploy.sh
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

2. **手动部署**
   ```bash
   # 安装Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # 克隆项目
   git clone https://github.com/OPTJoker/toGO.git
   cd toGO

   # 启动服务
   docker-compose up -d --build
   ```

### 📈 监控指标

- **内存使用率**: 建议保持在80%以下
- **磁盘使用率**: 建议保持在80%以下
- **存储文件大小**: 上传+输出文件总和建议不超过30GB
- **CPU负载**: 平均负载建议不超过3.0

### 🚨 告警阈值

- 内存使用率 > 80%：黄色警告
- 内存使用率 > 90%：红色告警
- 磁盘使用率 > 80%：建议清理
- 存储文件 > 30GB：需要清理

### 🔄 维护任务

#### 自动任务
- **每小时**: 清理过期文件
- **每天2点**: Docker系统清理
- **每周日3点**: 重启应用

#### 手动任务
- **每周**: 查看系统监控页面
- **每月**: 检查磁盘空间和日志
- **季度**: 备份重要配置

### 🛠️ 故障排查

#### 常见问题

1. **上传失败**
   ```bash
   # 检查文件大小限制
   # 检查磁盘空间
   df -h
   ```

2. **转换慢**
   ```bash
   # 检查CPU和内存使用
   docker stats
   ```

3. **存储空间不足**
   ```bash
   # 手动清理
   curl -X POST http://localhost:8080/api/cleanup
   ```

4. **服务异常**
   ```bash
   # 重启服务
   docker-compose restart
   ```

### 📝 性能调优建议

1. **升级优先级**
   - 带宽 > 存储 > 内存 > CPU

2. **成本效益**
   - 10Mbps带宽提升用户体验最明显
   - 100GB数据盘解决存储问题
   - 16GB内存支持更多并发

3. **扩展方案**
   - 使用对象存储（OSS/S3）
   - CDN加速静态资源
   - 负载均衡多实例部署

### 🔒 安全建议

1. **网络安全**
   - 配置防火墙
   - 使用HTTPS (SSL证书)
   - 限制API访问频率

2. **文件安全**
   - 文件类型验证
   - 恶意文件扫描
   - 定期备份配置

3. **系统安全**
   - 定期更新系统
   - 最小权限原则
   - 日志监控

## 📞 技术支持

如遇到问题，请：
1. 查看监控页面系统状态
2. 检查 Docker 容器日志
3. 运行监控脚本查看详细信息
4. 提交 GitHub Issue
