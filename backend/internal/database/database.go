package database

import (
	"fmt"
	"log"

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

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
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
