package handlers

import (
	"log"
	"net/http"
	"time"

	"toGif-backend/internal/database"
	"toGif-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// RecordVisitor 记录访问者
func RecordVisitor(c *gin.Context) {
	// 添加日志记录
	log.Printf("RecordVisitor called from IP: %s", c.ClientIP())

	clientIP := getClientIP(c)
	userAgent := c.GetHeader("User-Agent")
	today := time.Now().Format("2006-01-02")

	// 验证基本参数
	if clientIP == "" {
		log.Printf("Invalid client IP")
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "无法获取客户端IP",
		})
		return
	}

	db := database.GetDB()
	if db == nil {
		log.Printf("Database connection is nil - stats feature disabled")
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "访问记录功能暂时不可用，但请求已处理",
		})
		return
	}

	// 检查数据库连接是否正常
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get underlying sql.DB: %v", err)
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "访问记录功能暂时不可用，但请求已处理",
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		log.Printf("Database ping failed: %v", err)
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "访问记录功能暂时不可用，但请求已处理",
		})
		return
	}

	// 直接尝试创建记录，如果违反唯一约束则忽略错误
	newRecord := database.VisitorRecord{
		IP:        clientIP,
		UserAgent: userAgent,
		Date:      today,
	}

	// 使用FirstOrCreate来避免重复插入
	var record database.VisitorRecord
	result := db.Where(database.VisitorRecord{IP: clientIP, Date: today}).FirstOrCreate(&record, newRecord)

	if result.Error != nil {
		log.Printf("Database operation failed: %v", result.Error)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "记录访问失败",
		})
		return
	}

	log.Printf("Visitor recorded successfully: IP=%s, Date=%s", clientIP, today)
	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "访问记录成功",
	})
}

// GetVisitorStats 获取访问统计
func GetVisitorStats(c *gin.Context) {
	log.Printf("GetVisitorStats called")

	today := time.Now().Format("2006-01-02")

	db := database.GetDB()
	if db == nil {
		log.Printf("Database connection is nil - returning default stats")
		stats := models.VisitorStats{
			TodayVisitors: 0,
			Date:          today,
		}
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "统计功能暂时不可用，返回默认值",
			Data:    stats,
		})
		return
	}

	// 检查数据库连接是否正常
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get underlying sql.DB: %v", err)
		stats := models.VisitorStats{
			TodayVisitors: 0,
			Date:          today,
		}
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "统计功能暂时不可用，返回默认值",
			Data:    stats,
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		log.Printf("Database ping failed: %v", err)
		stats := models.VisitorStats{
			TodayVisitors: 0,
			Date:          today,
		}
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "统计功能暂时不可用，返回默认值",
			Data:    stats,
		})
		return
	}

	// 统计今日访问人数
	var count int64
	if err := db.Model(&database.VisitorRecord{}).Where("date = ?", today).Count(&count).Error; err != nil {
		log.Printf("Failed to get visitor stats: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取统计失败",
		})
		return
	}

	stats := models.VisitorStats{
		TodayVisitors: int(count),
		Date:          today,
	}

	log.Printf("Visitor stats retrieved: %d visitors today", count)
	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "获取统计成功",
		Data:    stats,
	})
}

// GetTotalVisitors 获取总访问人数
func GetTotalVisitors(c *gin.Context) {
	log.Printf("GetTotalVisitors called")

	db := database.GetDB()
	if db == nil {
		log.Printf("Database connection is nil - returning default total")
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "统计功能暂时不可用，返回默认值",
			Data:    map[string]interface{}{"totalVisitors": 0},
		})
		return
	}

	// 检查数据库连接是否正常
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get underlying sql.DB: %v", err)
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "统计功能暂时不可用，返回默认值",
			Data:    map[string]interface{}{"totalVisitors": 0},
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		log.Printf("Database ping failed: %v", err)
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "统计功能暂时不可用，返回默认值",
			Data:    map[string]interface{}{"totalVisitors": 0},
		})
		return
	}

	// 统计总访问人数（去重IP）
	var count int64
	if err := db.Model(&database.VisitorRecord{}).Distinct("ip").Count(&count).Error; err != nil {
		log.Printf("Failed to get total visitors: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取总人数失败",
		})
		return
	}

	log.Printf("Total visitors retrieved: %d unique visitors", count)
	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "获取总人数成功",
		Data:    map[string]interface{}{"totalVisitors": int(count)},
	})
}

// getClientIP 获取客户端真实IP
func getClientIP(c *gin.Context) string {
	// 尝试从各种header中获取真实IP
	clientIP := c.GetHeader("X-Forwarded-For")
	if clientIP == "" {
		clientIP = c.GetHeader("X-Real-Ip")
	}
	if clientIP == "" {
		clientIP = c.GetHeader("X-Forwarded-For")
	}
	if clientIP == "" {
		clientIP = c.ClientIP()
	}

	// 如果仍然为空，使用默认值
	if clientIP == "" {
		clientIP = "unknown"
	}

	return clientIP
}
