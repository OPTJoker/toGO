package main

import (
	"log"
	"net/http"
	"os"

	"toGif-backend/internal/config"
	"toGif-backend/internal/handlers"
	"toGif-backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	// 创建Gin引擎
	r := gin.Default()

	// 配置CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// 使用中间件
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// 创建上传目录
	os.MkdirAll("./uploads", 0755)
	os.MkdirAll("./output", 0755)

	// 初始化清理服务
	handlers.InitCleanupService("./uploads", "./output")

	// 静态文件服务
	r.Static("/static", "./output")

	// API路由组
	api := r.Group("/api")
	{
		// 系统监控路由
		api.GET("/health", handlers.HealthCheck)
		api.POST("/cleanup", handlers.ForceCleanup)

		// 视频处理相关路由
		video := api.Group("/video")
		{
			video.POST("/to-gif", handlers.VideoToGif)
			video.GET("/history", handlers.GetConversionHistory)
			video.DELETE("/history/:id", handlers.DeleteConversionHistory)
		}

		// 文件压缩相关路由
		compress := api.Group("/compress")
		{
			compress.POST("/file/:filename", handlers.CompressFile)
			compress.POST("/decompress/:filename", handlers.DecompressFile)
		}

		// 旧的健康检查保持兼容性
		api.GET("/health-simple", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"message": "Service is running",
			})
		})
	}

	// 启动服务器
	log.Printf("Server starting on port %s", cfg.ServerPort)
	log.Printf("Base URL: %s", cfg.BaseURL)
	log.Printf("Static URL: %s", cfg.StaticURL)
	log.Printf("Environment: %s", cfg.Environment)

	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
