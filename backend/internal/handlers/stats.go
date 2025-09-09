package handlers

import (
	"log"
	"net/http"
	"time"

	"toGif-backend/internal/database"
	"toGif-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// tryReconnectDB 尝试重新连接数据库
func tryReconnectDB() *gorm.DB {
	if !database.IsDBConnected() {
		log.Printf("Database connection lost, attempting to reconnect...")
		if err := database.ReconnectDB(); err != nil {
			log.Printf("Failed to reconnect to database: %v", err)
			return nil
		}
		log.Printf("Database reconnected successfully")
	}
	return database.GetDB()
}

// RecordVisitor 记录访问者 - 优化版本
func RecordVisitor(c *gin.Context) {
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
	if db == nil || !database.IsDBConnected() {
		db = tryReconnectDB()
		if db == nil {
			log.Printf("Database connection is nil - stats feature disabled")
			c.JSON(http.StatusOK, models.APIResponse{
				Code:    200,
				Message: "访问记录功能暂时不可用，但请求已处理",
			})
			return
		}
	}

	// 检查数据库连接
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

	// 使用事务确保数据一致性
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. 插入访问记录（不去重，记录所有访问）
	newRecord := database.VisitorRecord{
		IP:        clientIP,
		UserAgent: userAgent,
		Date:      today,
	}

	if err := tx.Create(&newRecord).Error; err != nil {
		tx.Rollback()
		log.Printf("Failed to create visitor record: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "记录访问失败",
		})
		return
	}

	// 2. 更新或创建唯一访客记录
	var uniqueVisitor database.UniqueVisitor
	result := tx.Where("ip = ?", clientIP).First(&uniqueVisitor)

	isNewVisitor := false
	if result.Error == gorm.ErrRecordNotFound {
		// 新访客
		uniqueVisitor = database.UniqueVisitor{
			IP:         clientIP,
			FirstSeen:  today,
			LastSeen:   today,
			VisitCount: 1,
		}
		if err := tx.Create(&uniqueVisitor).Error; err != nil {
			tx.Rollback()
			log.Printf("Failed to create unique visitor: %v", err)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Code:    500,
				Message: "记录访问失败",
			})
			return
		}
		isNewVisitor = true
		log.Printf("New unique visitor: IP=%s", clientIP)
	} else if result.Error == nil {
		// 老访客，更新记录
		uniqueVisitor.LastSeen = today
		uniqueVisitor.VisitCount++
		if err := tx.Save(&uniqueVisitor).Error; err != nil {
			tx.Rollback()
			log.Printf("Failed to update unique visitor: %v", err)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Code:    500,
				Message: "记录访问失败",
			})
			return
		}
		log.Printf("Updated visitor: IP=%s, total visits=%d", clientIP, uniqueVisitor.VisitCount)
	} else {
		tx.Rollback()
		log.Printf("Database query failed: %v", result.Error)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "记录访问失败",
		})
		return
	}

	// 3. 更新今日统计
	var todayStats database.VisitorStats
	statsResult := tx.Where("date = ?", today).First(&todayStats)

	if statsResult.Error == gorm.ErrRecordNotFound {
		// 创建今日统计记录
		totalUniqueIPs := int64(0)
		tx.Model(&database.UniqueVisitor{}).Count(&totalUniqueIPs)

		todayVisitors := int64(0)
		tx.Model(&database.VisitorRecord{}).Where("date = ?", today).Count(&todayVisitors)

		todayStats = database.VisitorStats{
			TotalUniqueIPs: int(totalUniqueIPs),
			TodayVisitors:  int(todayVisitors),
			Date:           today,
		}
		if err := tx.Create(&todayStats).Error; err != nil {
			tx.Rollback()
			log.Printf("Failed to create today stats: %v", err)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Code:    500,
				Message: "记录访问失败",
			})
			return
		}
	} else if statsResult.Error == nil {
		// 更新今日统计
		todayStats.TodayVisitors++
		if isNewVisitor {
			todayStats.TotalUniqueIPs++
		}
		if err := tx.Save(&todayStats).Error; err != nil {
			tx.Rollback()
			log.Printf("Failed to update today stats: %v", err)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Code:    500,
				Message: "记录访问失败",
			})
			return
		}
	} else {
		tx.Rollback()
		log.Printf("Failed to query today stats: %v", statsResult.Error)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "记录访问失败",
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "记录访问失败",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "访问记录成功",
	})
}

// GetVisitorStats 获取访问统计 - 修复逻辑版本
func GetVisitorStats(c *gin.Context) {
	log.Printf("GetVisitorStats called")

	today := time.Now().Format("2006-01-02")

	db := database.GetDB()
	if db == nil || !database.IsDBConnected() {
		db = tryReconnectDB()
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
	}

	// 检查数据库连接
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get underlying sql.DB: %v", err)
		stats := models.VisitorStats{
			TodayVisitors: 0,
			Date:          today,
		}
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "毁灭吧，仓库着火🔥了",
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
			Message: "毁灭吧，数据仓挂了",
			Data:    stats,
		})
		return
	}

	// 统计今日唯一访客数（从UniqueVisitor表中统计今日首次访问或最后访问为今日的用户）
	var todayUniqueVisitors int64
	if err := db.Model(&database.UniqueVisitor{}).Where("first_seen = ? OR last_seen = ?", today, today).Count(&todayUniqueVisitors).Error; err != nil {
		log.Printf("Failed to get today unique visitors: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取统计失败",
		})
		return
	}

	stats := models.VisitorStats{
		TodayVisitors: int(todayUniqueVisitors),
		Date:          today,
	}

	log.Printf("Today unique visitors retrieved: %d unique visitors", todayUniqueVisitors)
	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "获取统计成功",
		Data:    stats,
	})
}

// GetTotalVisitors 获取总访问人数 - 优化版本
func GetTotalVisitors(c *gin.Context) {
	log.Printf("GetTotalVisitors called")

	db := database.GetDB()
	if db == nil || !database.IsDBConnected() {
		db = tryReconnectDB()
		if db == nil {
			log.Printf("Database connection is nil - returning default total")
			c.JSON(http.StatusOK, models.APIResponse{
				Code:    200,
				Message: "统计功能暂时不可用，返回默认值",
				Data:    map[string]interface{}{"totalVisitors": 0},
			})
			return
		}
	}

	// 检查数据库连接
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

	// 从 UniqueVisitor 表统计总人数（性能优化）
	var count int64
	if err := db.Model(&database.UniqueVisitor{}).Count(&count).Error; err != nil {
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
