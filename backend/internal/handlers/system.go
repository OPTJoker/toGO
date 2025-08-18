package handlers

import (
	"net/http"
	"runtime"
	"time"

	"toGif-backend/internal/models"
	"toGif-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// SystemInfo 系统信息
type SystemInfo struct {
	CPUUsage    float64 `json:"cpuUsage"`
	MemoryUsage int64   `json:"memoryUsage"`
	MemoryTotal int64   `json:"memoryTotal"`
	UploadsSize int64   `json:"uploadsSize"`
	OutputSize  int64   `json:"outputSize"`
	Goroutines  int     `json:"goroutines"`
	Timestamp   string  `json:"timestamp"`
}

var cleanupService *utils.CleanupService

// InitCleanupService 初始化清理服务
func InitCleanupService(uploadsDir, outputDir string) {
	cleanupService = utils.NewCleanupService(uploadsDir, outputDir)
	cleanupService.StartCleanupRoutine()
}

// HealthCheck 健康检查接口
func HealthCheck(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	var uploadsSize, outputSize int64
	if cleanupService != nil {
		uploadsSize, outputSize, _ = cleanupService.GetDiskUsage()
	}

	systemInfo := SystemInfo{
		CPUUsage:    float64(runtime.NumGoroutine()), // 简化的CPU使用率
		MemoryUsage: int64(m.Alloc),
		MemoryTotal: int64(m.Sys),
		UploadsSize: uploadsSize,
		OutputSize:  outputSize,
		Goroutines:  runtime.NumGoroutine(),
		Timestamp:   time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "系统运行正常",
		Data:    systemInfo,
	})
}

// ForceCleanup 强制清理接口
func ForceCleanup(c *gin.Context) {
	if cleanupService == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "清理服务未初始化",
		})
		return
	}

	err := cleanupService.ForceCleanup()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "清理失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "清理完成",
	})
}
