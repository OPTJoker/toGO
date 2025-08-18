package models

import "time"

// APIResponse 统一API响应结构
type APIResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// VideoToGifRequest 视频转GIF请求参数
type VideoToGifRequest struct {
	StartTime *float64 `form:"startTime"`
	Duration  *float64 `form:"duration"`
	Width     *int     `form:"width"`
	Quality   string   `form:"quality"`
}

// VideoToGifResponse 视频转GIF响应
type VideoToGifResponse struct {
	GifURL           string   `json:"gifUrl"`
	FileSize         int64    `json:"fileSize"`
	Duration         float64  `json:"duration"`
	VideoDuration    float64  `json:"videoDuration"`
	ZipURL           *string  `json:"zipUrl,omitempty"`           // ZIP压缩包下载链接（仅大文件）
	ZipSize          *int64   `json:"zipSize,omitempty"`          // ZIP文件大小（仅大文件）
	CompressionRatio *float64 `json:"compressionRatio,omitempty"` // 压缩率（仅大文件）
}

// ConversionHistoryItem 转换历史记录项
type ConversionHistoryItem struct {
	ID        string    `json:"id"`
	Filename  string    `json:"filename"`
	GifURL    string    `json:"gifUrl"`
	FileSize  int64     `json:"fileSize"`
	CreatedAt time.Time `json:"createdAt"`
}
