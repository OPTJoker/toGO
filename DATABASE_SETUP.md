# 数据库配置说明

## MySQL 数据库设置

### 1. 安装 MySQL

#### macOS
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Windows
下载并安装 MySQL Community Server：https://dev.mysql.com/downloads/mysql/

### 2. 创建数据库

#### 方法一：使用初始化脚本
1. 登录 MySQL：
```bash
mysql -u root -p
```

2. 在MySQL客户端中执行初始化脚本：
```sql
source backend/init_database.sql;
```

3. 退出MySQL：
```sql
exit;
```

#### 方法二：直接执行SQL文件
```bash
mysql -u root -p < backend/init_database.sql
```

#### 方法三：手动创建
登录MySQL后手动执行：
```sql
CREATE DATABASE IF NOT EXISTS toGO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

#### 开发环境
编辑 `backend/.env.development` 文件：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=toGO
```

#### 生产环境
编辑 `backend/.env.production` 文件：
```
DB_HOST=your_production_host
DB_PORT=3306
DB_USER=your_production_user
DB_PASSWORD=your_production_password
DB_NAME=toGO
```

### 4. 数据库表结构

应用启动时会自动创建以下表：

#### visitor_records 表
- `id`: 主键，自增
- `ip`: 访问者IP地址（最大45字符，支持IPv6）
- `user_agent`: 用户代理字符串（最大500字符）
- `date`: 访问日期（YYYY-MM-DD格式）
- `created_at`: 创建时间戳

### 5. 功能说明

- **访问统计**：基于IP地址去重，每个IP每天只计算一次访问
- **数据持久化**：使用MySQL存储，重启服务不会丢失数据
- **自动清理**：可以根据需要添加定时任务清理历史数据
- **性能优化**：在ip和date字段上建立了索引

### 6. 故障排除

如果数据库连接失败，应用会继续运行但统计功能将被禁用。检查：

1. MySQL服务是否正在运行
2. 数据库连接参数是否正确
3. 数据库用户是否有足够权限
4. 防火墙设置是否允许连接

### 7. 可选：创建专用数据库用户

为了安全起见，建议创建专用的数据库用户：

```sql
CREATE USER 'togo_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX ON toGO.* TO 'togo_user'@'localhost';
FLUSH PRIVILEGES;
```

然后在环境变量中使用这个用户：
```
DB_USER=togo_user
DB_PASSWORD=secure_password
```