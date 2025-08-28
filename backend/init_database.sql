-- 创建数据库
CREATE DATABASE IF NOT EXISTS togo_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE togo_stats;

-- 创建访问记录表（GORM会自动创建，这里仅作参考）
-- CREATE TABLE IF NOT EXISTS visitor_records (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     ip VARCHAR(45) NOT NULL,
--     user_agent VARCHAR(500),
--     date VARCHAR(10) NOT NULL,
--     created_at BIGINT NOT NULL,
--     INDEX idx_ip (ip),
--     INDEX idx_date (date)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;