package main

import (
	"log"
	"net/http"
	"os"

	"toGif-backend/internal/config"
	"toGif-backend/internal/database"
	"toGif-backend/internal/handlers"
	"toGif-backend/internal/middleware"
	"toGif-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 初始化数据库
	if err := database.InitDatabase(); err != nil {
		log.Printf("Database initialization failed: %v", err)
		log.Println("Continuing without database (stats features will be disabled)")
	}

	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	// 创建Gin引擎
	r := gin.Default()

	// 配置CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"http://tugou.site",
		"https://tugou.site",
		"http://www.tugou.site",
		"https://www.tugou.site",
		"http://101.126.6.243",
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// 使用中间件
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// 创建上传目录
	os.MkdirAll(cfg.UploadDir, 0755)
	os.MkdirAll(cfg.StaticDir, 0755)

	// 初始化清理服务
	handlers.InitCleanupService(cfg.UploadDir, cfg.StaticDir)

	// 静态文件服务 - 添加CORS支持
	staticHandler := func(c *gin.Context) {
		// 设置CORS头
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		// 提供静态文件 - 使用配置中的路径
		filepath := c.Param("filepath")
		c.File(cfg.StaticDir + filepath)
	}

	r.GET("/static/*filepath", staticHandler)
	r.HEAD("/static/*filepath", staticHandler)

	// 为OPTIONS请求添加专门的处理
	r.OPTIONS("/static/*filepath", func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.AbortWithStatus(204)
	})
	r.GET("/", gin.HandlerFunc(func(c *gin.Context) {
		c.JSON(http.StatusOK, models.APIResponse{
			Code:    200,
			Message: "Hi 🐕",
		})
	}))

	// API路由组
	api := r.Group("/api")
	{
		// API根路径信息
		api.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, models.APIResponse{
				Code:    200,
				Message: "toGO API Service",
				Data: gin.H{
					"version": "1.0.0",
					"endpoints": gin.H{
						"health":   "/api/health",
						"video":    "/api/video/*",
						"compress": "/api/compress/*",
						"qrcode":   "/api/qrcode/*",
						"stats":    "/api/stats/*",
					},
				},
			})
		})

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

		// 二维码生成相关路由
		qrcode := api.Group("/qrcode")
		{
			qrcode.POST("/generate", handlers.GenerateQRCode)
			qrcode.GET("/image", handlers.GetQRCodeImage)
		}

		// 访问统计相关路由
		stats := api.Group("/stats")
		{
			stats.POST("/record", handlers.RecordVisitor)
			stats.GET("/visitors", handlers.GetVisitorStats)
			stats.GET("/total", handlers.GetTotalVisitors)
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
