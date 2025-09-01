package database

import (
	"fmt"
	"log"
	"time"

	"toGif-backend/internal/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// VisitorRecord 访问记录数据库模型
type VisitorRecord struct {
	ID        uint   `gorm:"primaryKey"`
	IP        string `gorm:"index;size:45;uniqueIndex:idx_ip_date"` // 与Date组成唯一索引
	UserAgent string `gorm:"size:500"`
	Date      string `gorm:"index;size:10;uniqueIndex:idx_ip_date"` // YYYY-MM-DD格式，与IP组成唯一索引
	CreatedAt int64  `gorm:"autoCreateTime"`
}

// InitDatabase 初始化数据库连接
func InitDatabase() error {
	cfg := config.LoadConfig()

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&timeout=10s&readTimeout=30s&writeTimeout=30s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // 生产环境建议使用Silent
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// 获取底层sql.DB对象并配置连接池
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	// 配置连接池参数
	sqlDB.SetMaxIdleConns(10)                  // 设置空闲连接池中连接的最大数量
	sqlDB.SetMaxOpenConns(100)                 // 设置打开数据库连接的最大数量
	sqlDB.SetConnMaxLifetime(time.Hour)        // 设置连接可复用的最大时间
	sqlDB.SetConnMaxIdleTime(10 * time.Minute) // 设置连接空闲的最大时间

	// 测试数据库连接
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	// 自动迁移数据库表
	err = DB.AutoMigrate(&VisitorRecord{})
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	log.Println("Database connected and migrated successfully")
	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return DB
}

// IsDBConnected 检查数据库连接是否有效
func IsDBConnected() bool {
	if DB == nil {
		return false
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return false
	}

	return sqlDB.Ping() == nil
}

// ReconnectDB 重新连接数据库
func ReconnectDB() error {
	log.Println("Attempting to reconnect to database...")
	return InitDatabase()
}
