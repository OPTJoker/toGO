#!/bin/bash
# 诊断静态文件问题的脚本

echo "🔍 诊断静态文件问题..."
echo ""

echo "1. 检查后端服务状态:"
systemctl status togo-backend --no-pager -l | head -10
echo ""

echo "2. 检查后端工作目录:"
echo "当前工作目录: $(pwd)"
echo ""

echo "3. 检查output目录:"
echo "检查 /opt/togo/output:"
ls -la /opt/togo/output/ 2>/dev/null || echo "目录不存在或无权限"
echo ""

echo "4. 检查当前目录的output:"
echo "检查 ./output:"
ls -la ./output/ 2>/dev/null || echo "目录不存在"
echo ""

echo "5. 搜索所有GIF文件:"
find /opt/togo -name "*.gif" -type f 2>/dev/null | head -10
find . -name "*.gif" -type f 2>/dev/null | head -10
echo ""

echo "6. 检查后端进程的工作目录:"
ps aux | grep togo-backend | grep -v grep
echo ""

echo "7. 测试静态文件访问:"
echo "测试本地访问:"
curl -I http://localhost:8080/static/1756867239.gif 2>/dev/null || echo "本地访问失败"
echo ""

echo "8. 检查nginx配置:"
echo "当前nginx配置中的静态文件部分:"
grep -A 10 "location /static/" /etc/nginx/sites-available/togo 2>/dev/null || echo "配置文件不存在"
echo ""

echo "9. 检查后端日志:"
echo "最近的后端日志:"
journalctl -u togo-backend --no-pager -n 20 | tail -10
echo ""

echo "10. 检查nginx日志:"
echo "最近的nginx访问日志:"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "日志文件不存在"
echo ""
echo "最近的nginx错误日志:"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "日志文件不存在"