package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"toGif-backend/internal/models"
	"toGif-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// VideoToGif 视频转GIF处理器
func VideoToGif(c *gin.Context) {
	// 解析请求参数
	var req models.VideoToGifRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "参数解析失败: " + err.Error(),
		})
		return
	}

	// 获取上传的文件
	file, err := c.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "请上传视频文件",
		})
		return
	}

	// 验证文件类型
	if !isVideoFile(file.Filename) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "不支持的文件格式，请上传视频文件",
		})
		return
	}

	// 检查文件大小 (100MB限制)
	if file.Size > 100*1024*1024 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "文件大小不能超过100MB",
		})
		return
	}

	// 创建FFmpeg服务实例
	ffmpegService := utils.NewFFmpegService()

	// 检查FFmpeg是否安装
	if err := ffmpegService.CheckFFmpegInstallation(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "服务器配置错误，FFmpeg未安装",
		})
		return
	}

	// 保存上传的文件
	inputFilename := utils.GenerateUniqueFilename(getFileExtension(file.Filename))
	inputPath := filepath.Join("uploads", inputFilename)

	if err := c.SaveUploadedFile(file, inputPath); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "文件保存失败: " + err.Error(),
		})
		return
	}

	// 确保在函数结束时清理临时文件
	defer func() {
		// 这里可以选择是否删除原始上传文件
		// os.Remove(inputPath)
	}()

	// 获取视频信息
	videoDuration, err := ffmpegService.GetVideoDuration(inputPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取视频信息失败: " + err.Error(),
		})
		return
	}

	// 设置默认参数
	startTime := float64(0)
	if req.StartTime != nil {
		startTime = *req.StartTime
	}

	// 默认转换整个视频时长
	duration := videoDuration
	if req.Duration != nil && *req.Duration > 0 {
		duration = *req.Duration
	}

	// 默认宽度设置为1080
	width := 1080
	if req.Width != nil {
		width = *req.Width
	}

	quality := "medium"
	if req.Quality != "" {
		quality = req.Quality
	}

	// 参数验证
	if startTime < 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "开始时间不能小于0",
		})
		return
	}

	// 检查开始时间不能超过视频总时长
	if startTime >= videoDuration {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: fmt.Sprintf("开始时间不能超过视频总时长(%.2f秒)", videoDuration),
		})
		return
	}

	// 调整持续时间，确保不超过视频剩余时长
	remainingDuration := videoDuration - startTime
	if duration > remainingDuration {
		duration = remainingDuration
	}

	// 最终验证duration是否有效
	if duration <= 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "计算后的持续时间无效",
		})
		return
	}

	if width < 100 || width > 3840 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "宽度必须在100-3840像素之间",
		})
		return
	}

	// 生成输出文件路径
	outputFilename := utils.GenerateUniqueFilename("gif")
	outputPath := filepath.Join("output", outputFilename)

	// 根据质量选择不同的转换方法 - 添加超高质量支持
	var convertErr error
	switch quality {
	case "ultra":
		// 超高质量使用调色板优化的高质量转换
		convertErr = ffmpegService.ConvertVideoToGifWithPalette(inputPath, outputPath, startTime, duration, width, quality)
	case "high":
		// 高质量也使用调色板优化转换，以提升效果
		convertErr = ffmpegService.ConvertVideoToGifWithPalette(inputPath, outputPath, startTime, duration, width, quality)
	case "medium", "low":
		// 中质量和低质量使用标准转换方法
		convertErr = ffmpegService.ConvertVideoToGif(inputPath, outputPath, startTime, duration, width, quality)
	default:
		// 默认使用标准转换方法
		convertErr = ffmpegService.ConvertVideoToGif(inputPath, outputPath, startTime, duration, width, quality)
	}

	if convertErr != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "视频转换失败: " + convertErr.Error(),
		})
		return
	}

	// 验证生成的GIF文件
	if !isValidGifFile(outputPath) {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "生成的GIF文件格式错误",
		})
		return
	}

	// 获取生成的GIF文件信息
	fileSize, err := utils.GetFileSize(outputPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取文件信息失败: " + err.Error(),
		})
		return
	}

	// 构建响应 - 返回完整的URL
	baseURL := "http://localhost:19988" // 可以从环境变量或配置文件读取
	response := models.VideoToGifResponse{
		GifURL:        fmt.Sprintf("%s/static/%s", baseURL, outputFilename),
		FileSize:      fileSize,
		Duration:      duration,
		VideoDuration: videoDuration,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "转换成功",
		Data:    response,
	})
}

// GetConversionHistory 获取转换历史记录
func GetConversionHistory(c *gin.Context) {
	outputDir := "output"

	// 读取output目录中的所有GIF文件
	files, err := os.ReadDir(outputDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "读取历史记录失败: " + err.Error(),
		})
		return
	}

	var historyItems []models.ConversionHistoryItem
	baseURL := "http://localhost:19988" // 可以从环境变量或配置文件读取

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		// 只处理GIF文件
		if !strings.HasSuffix(strings.ToLower(file.Name()), ".gif") {
			continue
		}

		filePath := filepath.Join(outputDir, file.Name())

		// 获取文件信息
		fileInfo, err := file.Info()
		if err != nil {
			continue
		}

		// 获取文件大小
		fileSize, err := utils.GetFileSize(filePath)
		if err != nil {
			continue
		}

		historyItem := models.ConversionHistoryItem{
			ID:        file.Name()[:len(file.Name())-4], // 去掉.gif后缀作为ID
			Filename:  file.Name(),
			GifURL:    fmt.Sprintf("%s/static/%s", baseURL, file.Name()),
			FileSize:  fileSize,
			CreatedAt: fileInfo.ModTime(),
		}

		historyItems = append(historyItems, historyItem)
	}

	// 按创建时间倒序排列（最新的在前面）
	for i, j := 0, len(historyItems)-1; i < j; i, j = i+1, j-1 {
		if historyItems[i].CreatedAt.Before(historyItems[j].CreatedAt) {
			historyItems[i], historyItems[j] = historyItems[j], historyItems[i]
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "获取成功",
		Data:    historyItems,
	})
}

// DeleteConversionHistory 删除转换历史记录
func DeleteConversionHistory(c *gin.Context) {
	// 获取要删除的文件ID（不含.gif后缀）
	fileID := c.Param("id")
	if fileID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "缺少文件ID参数",
		})
		return
	}

	// 构建文件路径
	filename := fileID + ".gif"
	filePath := filepath.Join("output", filename)

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Code:    404,
			Message: "文件不存在",
		})
		return
	}

	// 删除文件
	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "删除文件失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "删除成功",
	})
}

// isVideoFile 检查是否为视频文件
func isVideoFile(filename string) bool {
	ext := strings.ToLower(getFileExtension(filename))
	videoExts := []string{"mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"}

	for _, videoExt := range videoExts {
		if ext == videoExt {
			return true
		}
	}
	return false
}

// getFileExtension 获取文件扩展名
func getFileExtension(filename string) string {
	ext := filepath.Ext(filename)
	if len(ext) > 1 {
		return ext[1:] // 移除点号
	}
	return ""
}

// isValidGifFile 验证GIF文件是否有效
func isValidGifFile(filePath string) bool {
	file, err := os.Open(filePath)
	if err != nil {
		return false
	}
	defer file.Close()

	// 读取文件头
	header := make([]byte, 6)
	n, err := file.Read(header)
	if err != nil || n != 6 {
		return false
	}

	// 检查GIF文件签名
	gif87a := []byte{'G', 'I', 'F', '8', '7', 'a'}
	gif89a := []byte{'G', 'I', 'F', '8', '9', 'a'}

	// 比较文件头
	for i := 0; i < 6; i++ {
		if header[i] != gif87a[i] && header[i] != gif89a[i] {
			return false
		}
	}

	// 检查文件大小
	stat, err := file.Stat()
	if err != nil {
		return false
	}

	// GIF文件至少应该有几百字节
	return stat.Size() > 100
}
