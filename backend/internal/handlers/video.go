package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"toGif-backend/internal/config"
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
	fmt.Printf("上传文件名: %s\n", file.Filename)
	if !isVideoFile(file.Filename) {
		fmt.Printf("文件类型验证失败: %s\n", file.Filename)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "不支持的文件格式，请上传视频文件",
		})
		return
	}
	fmt.Printf("文件类型验证通过: %s\n", file.Filename)

	// 检查文件大小 (50MB限制，适配4Mbps带宽)
	maxFileSize := int64(50 * 1024 * 1024) // 50MB
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "文件大小不能超过50MB，请压缩后上传",
		})
		return
	}

	// 创建FFmpeg服务实例
	ffmpegService := utils.NewFFmpegService()
	compressionService := utils.NewCompressionService()

	// 检查FFmpeg是否安装
	if err := ffmpegService.CheckFFmpegInstallation(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "服务器配置错误，FFmpeg未安装",
		})
		return
	}

	// 保存上传的文件
	// 如果是压缩文件，使用原始文件的扩展名
	originalFilename := file.Filename
	if strings.HasSuffix(strings.ToLower(file.Filename), ".gz") {
		originalFilename = strings.TrimSuffix(file.Filename, ".gz")
		originalFilename = strings.TrimSuffix(originalFilename, ".GZ")
	}

	inputFilename := utils.GenerateUniqueFilename(getFileExtension(originalFilename))
	inputPath := filepath.Join("uploads", inputFilename)

	// 先保存上传的文件到临时位置
	tempPath := inputPath + ".temp"
	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "文件保存失败: " + err.Error(),
		})
		return
	}

	// 检查是否需要解压缩上传的文件（通过文件内容检测）
	fmt.Printf("检查文件是否需要解压: %s\n", tempPath)
	if compressionService.IsFileCompressedContent(tempPath) {
		fmt.Printf("检测到压缩文件，开始解压: %s -> %s\n", tempPath, inputPath)
		// 如果是压缩文件，解压到最终位置
		if err := compressionService.DecompressFile(tempPath, inputPath); err != nil {
			os.Remove(tempPath) // 清理临时文件
			fmt.Printf("文件解压失败: %v\n", err)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Code:    500,
				Message: "文件解压失败: " + err.Error(),
			})
			return
		}

		// 删除临时压缩文件
		os.Remove(tempPath)
		fmt.Printf("文件解压成功: %s -> %s\n", tempPath, inputPath)
	} else {
		fmt.Printf("未压缩文件，直接移动: %s -> %s\n", tempPath, inputPath)
		// 直接移动文件到最终位置
		if err := os.Rename(tempPath, inputPath); err != nil {
			os.Remove(tempPath) // 清理临时文件
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Code:    500,
				Message: "文件移动失败: " + err.Error(),
			})
			return
		}
		fmt.Printf("文件直接保存: %s\n", inputPath)
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

	// 构建基础响应
	response := models.VideoToGifResponse{
		GifURL:        config.BuildStaticURL(outputFilename),
		FileSize:      fileSize,
		Duration:      duration,
		VideoDuration: videoDuration,
	}

	// 只有当GIF文件>=8MB时才创建ZIP压缩包
	const compressionThreshold = 8 * 1024 * 1024 // 8MB
	if fileSize >= compressionThreshold {
		fmt.Printf("GIF文件大小: %d bytes, 达到压缩阈值(%d bytes)，创建ZIP压缩包\n", fileSize, compressionThreshold)

		zipFilename := strings.Replace(outputFilename, ".gif", ".zip", 1)
		zipPath := filepath.Join("output", zipFilename)

		// 创建ZIP压缩包
		if err := compressionService.CreateZipArchive([]string{outputPath}, zipPath); err != nil {
			// ZIP创建失败不影响主流程，仅记录日志
			fmt.Printf("创建ZIP压缩包失败: %v\n", err)
		} else {
			// 获取ZIP文件大小
			if zipSize, err := utils.GetFileSize(zipPath); err == nil {
				zipURL := config.BuildStaticURL(zipFilename)
				compressionRatio := compressionService.GetCompressionRatio(fileSize, zipSize)

				// 添加ZIP信息到响应
				response.ZipURL = &zipURL
				response.ZipSize = &zipSize
				response.CompressionRatio = &compressionRatio

				fmt.Printf("ZIP压缩包创建成功: %s, 大小: %d bytes, 压缩率: %.1f%%\n",
					zipFilename, zipSize, compressionRatio)
			}
		}
	} else {
		fmt.Printf("GIF文件大小: %d bytes, 未达到压缩阈值(%d bytes)，跳过ZIP创建\n", fileSize, compressionThreshold)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "转换成功",
		Data:    response,
	})
}

// CompressFile 压缩文件接口
func CompressFile(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "文件名不能为空",
		})
		return
	}

	// 构建文件路径
	filePath := filepath.Join("output", filename)

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Code:    404,
			Message: "文件不存在",
		})
		return
	}

	// 检查是否已经是压缩文件
	compressionService := utils.NewCompressionService()
	if compressionService.IsFileCompressed(filename) {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "文件已经是压缩格式",
		})
		return
	}

	// 生成压缩文件路径
	compressedFilename := filename + ".gz"
	compressedPath := filepath.Join("output", compressedFilename)

	// 压缩文件
	if err := compressionService.CompressFile(filePath, compressedPath); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "文件压缩失败: " + err.Error(),
		})
		return
	}

	// 获取压缩后文件大小
	compressedSize, err := utils.GetFileSize(compressedPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取压缩文件大小失败: " + err.Error(),
		})
		return
	}

	// 获取原文件大小
	originalSize, err := utils.GetFileSize(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "获取原文件大小失败: " + err.Error(),
		})
		return
	}

	// 计算压缩率
	compressionRatio := compressionService.GetCompressionRatio(originalSize, compressedSize)

	response := map[string]interface{}{
		"compressedUrl":    config.BuildStaticURL(compressedFilename),
		"originalSize":     originalSize,
		"compressedSize":   compressedSize,
		"compressionRatio": compressionRatio,
		"savedBytes":       originalSize - compressedSize,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "压缩成功",
		Data:    response,
	})
}

// DecompressFile 解压文件接口
func DecompressFile(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "文件名不能为空",
		})
		return
	}

	// 构建文件路径
	filePath := filepath.Join("output", filename)

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Code:    404,
			Message: "文件不存在",
		})
		return
	}

	compressionService := utils.NewCompressionService()

	// 检查是否是支持的压缩格式
	if !strings.HasSuffix(strings.ToLower(filename), ".gz") {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Code:    400,
			Message: "不支持的压缩格式，目前只支持.gz格式",
		})
		return
	}

	// 生成解压文件路径
	decompressedFilename := strings.TrimSuffix(filename, ".gz")
	decompressedPath := filepath.Join("output", decompressedFilename)

	// 解压文件
	if err := compressionService.DecompressFile(filePath, decompressedPath); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Code:    500,
			Message: "文件解压失败: " + err.Error(),
		})
		return
	}

	response := map[string]interface{}{
		"decompressedUrl": config.BuildStaticURL(decompressedFilename),
		"filename":        decompressedFilename,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Code:    200,
		Message: "解压成功",
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
			GifURL:    config.BuildStaticURL(file.Name()),
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

// isVideoFile 检查是否为视频文件（支持压缩格式）
func isVideoFile(filename string) bool {
	// 如果是压缩文件，先去掉压缩扩展名
	originalFilename := filename
	if strings.HasSuffix(strings.ToLower(filename), ".gz") {
		originalFilename = strings.TrimSuffix(filename, ".gz")
		originalFilename = strings.TrimSuffix(originalFilename, ".GZ")
	}

	ext := strings.ToLower(getFileExtension(originalFilename))
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
