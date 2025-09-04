-- toGO 项目数据库初始化脚本
-- 创建数据库和相关表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS toGO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE toGO;

-- 创建访问记录表 - 记录所有访问，不去重
CREATE TABLE IF NOT EXISTS visitor_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL COMMENT '访问者IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理字符串',
    date VARCHAR(10) NOT NULL COMMENT '访问日期 YYYY-MM-DD',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    INDEX idx_ip (ip),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问记录表';

-- 创建唯一访客表 - 用于快速统计总人数
CREATE TABLE IF NOT EXISTS unique_visitors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL COMMENT '访问者IP地址',
    first_seen VARCHAR(10) NOT NULL COMMENT '首次访问日期 YYYY-MM-DD',
    last_seen VARCHAR(10) NOT NULL COMMENT '最后访问日期 YYYY-MM-DD',
    visit_count BIGINT NOT NULL DEFAULT 1 COMMENT '访问次数',
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    updated_at BIGINT NOT NULL COMMENT '更新时间戳',
    UNIQUE INDEX idx_unique_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='唯一访客表';

-- 创建访问统计缓存表 - 用于性能优化
CREATE TABLE IF NOT EXISTS visitor_stats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    total_unique_ips BIGINT NOT NULL DEFAULT 0 COMMENT '总的唯一IP数量',
    today_visitors BIGINT NOT NULL DEFAULT 0 COMMENT '今日访问数',
    date VARCHAR(10) NOT NULL COMMENT '统计日期 YYYY-MM-DD',
    last_updated BIGINT NOT NULL COMMENT '最后更新时间戳',
    UNIQUE INDEX idx_unique_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问统计缓存表';

-- 插入说明注释
INSERT INTO visitor_stats (total_unique_ips, today_visitors, date, last_updated) 
VALUES (0, 0, DATE_FORMAT(NOW(), '%Y-%m-%d'), UNIX_TIMESTAMP()) 
ON DUPLICATE KEY UPDATE last_updated = UNIX_TIMESTAMP();

-- 显示创建的表
SHOW TABLES;

-- 显示表结构
DESCRIBE visitor_records;
DESCRIBE unique_visitors;
DESCRIBE visitor_stats;