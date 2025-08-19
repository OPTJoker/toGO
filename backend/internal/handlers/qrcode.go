package handlers

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
)

// QRCodeRequest 二维码生成请求结构
type QRCodeRequest struct {
	Text    string `json:"text" binding:"required"`
	Size    int    `json:"size"`
	Level   string `json:"level"`
	Color   string `json:"color"`
	BgColor string `json:"bgColor"`
}

// QRCodeResponse 二维码生成响应结构
type QRCodeResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    string `json:"data,omitempty"` // base64编码的图片数据
}

// GenerateQRCode 生成二维码
func GenerateQRCode(c *gin.Context) {
	var req QRCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, QRCodeResponse{
			Success: false,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 设置默认值
	if req.Size == 0 {
		req.Size = 256
	}
	if req.Level == "" {
		req.Level = "M"
	}

	// 验证参数
	if req.Text == "" {
		c.JSON(http.StatusBadRequest, QRCodeResponse{
			Success: false,
			Message: "文本内容不能为空",
		})
		return
	}

	if req.Size < 64 || req.Size > 1024 {
		c.JSON(http.StatusBadRequest, QRCodeResponse{
			Success: false,
			Message: "图片尺寸必须在64-1024之间",
		})
		return
	}

	// 转换容错级别
	var recoveryLevel qrcode.RecoveryLevel
	switch req.Level {
	case "L":
		recoveryLevel = qrcode.Low
	case "M":
		recoveryLevel = qrcode.Medium
	case "Q":
		recoveryLevel = qrcode.High
	case "H":
		recoveryLevel = qrcode.Highest
	default:
		recoveryLevel = qrcode.Medium
	}

	// 生成二维码
	qr, err := qrcode.New(req.Text, recoveryLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, QRCodeResponse{
			Success: false,
			Message: "生成二维码失败: " + err.Error(),
		})
		return
	}

	// 设置二维码颜色（目前库不支持自定义颜色，使用默认黑白）
	// TODO: 可以考虑使用其他支持颜色自定义的库

	// 生成PNG数据
	pngData, err := qr.PNG(req.Size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, QRCodeResponse{
			Success: false,
			Message: "生成PNG数据失败: " + err.Error(),
		})
		return
	}

	// 转换为base64
	base64Data := base64.StdEncoding.EncodeToString(pngData)

	c.JSON(http.StatusOK, QRCodeResponse{
		Success: true,
		Message: "二维码生成成功",
		Data:    "data:image/png;base64," + base64Data,
	})
}

// GetQRCodeImage 直接返回二维码图片（GET请求方式）
func GetQRCodeImage(c *gin.Context) {
	text := c.Query("text")
	if text == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "text参数不能为空",
		})
		return
	}

	// 获取可选参数
	sizeStr := c.DefaultQuery("size", "256")
	size, err := strconv.Atoi(sizeStr)
	if err != nil || size < 64 || size > 1024 {
		size = 256
	}

	level := c.DefaultQuery("level", "M")
	var recoveryLevel qrcode.RecoveryLevel
	switch level {
	case "L":
		recoveryLevel = qrcode.Low
	case "M":
		recoveryLevel = qrcode.Medium
	case "Q":
		recoveryLevel = qrcode.High
	case "H":
		recoveryLevel = qrcode.Highest
	default:
		recoveryLevel = qrcode.Medium
	}

	// 生成二维码
	qr, err := qrcode.New(text, recoveryLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "生成二维码失败: " + err.Error(),
		})
		return
	}

	// 生成PNG数据
	pngData, err := qr.PNG(size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "生成PNG数据失败: " + err.Error(),
		})
		return
	}

	// 设置响应头
	c.Header("Content-Type", "image/png")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"qrcode_%dx%d.png\"", size, size))
	c.Header("Cache-Control", "public, max-age=3600") // 缓存1小时

	// 返回图片数据
	c.Data(http.StatusOK, "image/png", pngData)
}
