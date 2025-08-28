package handlers

import (
	"net/http"
	"time"

	"toGif-backend/internal/database"
	"toGif-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// RecordVisitor 记录访问者
func RecordVisitor(c *gin.Context) {
	clientIP := getClientIP(c)
	userAgent := c.GetHeader("User-Agent")
	today := time.Now().Format("2006-01-02")

	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "数据库连接失败",
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
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "记录访问失败: " + result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "访问记录成功",
	})
}

// GetVisitorStats 获取访问统计
func GetVisitorStats(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "数据库连接失败",
		})
		return
	}

	// 统计今日访问人数
	var count int64
	if err := db.Model(&database.VisitorRecord{}).Where("date = ?", today).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取统计失败: " + err.Error(),
		})
		return
	}

	stats := models.VisitorStats{
		TodayVisitors: int(count),
		Date:          today,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "获取统计成功",
		Data:    stats,
	})
}

// GetTotalVisitors 获取总访问人数
func GetTotalVisitors(c *gin.Context) {
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "数据库连接失败",
		})
		return
	}

	// 统计总访问人数（去重IP）
	var count int64
	if err := db.Model(&database.VisitorRecord{}).Distinct("ip").Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取总人数失败: " + err.Error(),
		})
		return
	}

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
	return clientIP
}
