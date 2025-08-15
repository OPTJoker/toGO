package utils

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// FFmpegService FFmpeg服务
type FFmpegService struct{}

// NewFFmpegService 创建FFmpeg服务实例
func NewFFmpegService() *FFmpegService {
	return &FFmpegService{}
}

// ConvertVideoToGif 将视频转换为GIF
func (f *FFmpegService) ConvertVideoToGif(inputPath, outputPath string, startTime, duration float64, width int, quality string) error {
	// 使用最兼容的FFmpeg命令来生成GIF
	args := []string{
		"-i", inputPath,
		"-y", // 覆盖输出文件
	}

	// 开始时间
	if startTime > 0 {
		args = append(args, "-ss", fmt.Sprintf("%.2f", startTime))
	}

	// 持续时间
	if duration > 0 {
		args = append(args, "-t", fmt.Sprintf("%.2f", duration))
	}

	// 优化文件大小的参数设置 - 尊重用户的宽度设置，添加超高质量选项
	var fps, scale string
	switch quality {
	case "ultra": // 超高质量 - 优先画质，文件大小可以大些
		fps = "20" // 高帧率
		if width > 0 {
			scale = fmt.Sprintf("scale=%d:-2:flags=lanczos", width) // 使用用户设置的宽度
		} else {
			scale = "scale=720:-2:flags=lanczos" // 更高的默认分辨率
		}
	case "high": // 高质量 - 提升效果，使用更好的参数
		fps = "12" // 提升帧率
		if width > 0 {
			scale = fmt.Sprintf("scale=%d:-2:flags=lanczos", width) // 使用lanczos缩放算法
		} else {
			scale = "scale=600:-2:flags=lanczos" // 提升默认分辨率
		}
	case "medium": // 中质量 - 使用原来高质量的逻辑
		fps = "8" // 使用原来高质量的帧率
		if width > 0 {
			scale = fmt.Sprintf("scale=%d:-2", width) // 使用用户设置的宽度
		} else {
			scale = "scale=480:-2" // 使用原来高质量的默认宽度
		}
	case "low":
		fps = "4"
		if width > 0 {
			scale = fmt.Sprintf("scale=%d:-2", width) // 使用用户设置的宽度
		} else {
			scale = "scale=240:-2"
		}
	default:
		fps = "8" // 使用原来高质量的帧率作为默认
		if width > 0 {
			scale = fmt.Sprintf("scale=%d:-2", width) // 使用用户设置的宽度
		} else {
			scale = "scale=480:-2" // 使用原来高质量的默认宽度
		}
	}

	// 使用最简单的滤镜来最小化文件大小
	filterStr := fmt.Sprintf("fps=%s,%s", fps, scale)
	args = append(args, "-vf", filterStr)

	// 简单的GIF输出参数
	args = append(args, outputPath)

	// 执行FFmpeg命令
	cmd := exec.Command("ffmpeg", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg error: %v, output: %s", err, string(output))
	}

	return nil
}

// ConvertVideoToGifWithPalette 使用调色板优化的高质量GIF转换
func (f *FFmpegService) ConvertVideoToGifWithPalette(inputPath, outputPath string, startTime, duration float64, width int, quality string) error {
	// 第一步：生成调色板
	paletteFile := strings.TrimSuffix(outputPath, filepath.Ext(outputPath)) + "_palette.png"
	defer os.Remove(paletteFile) // 清理临时调色板文件

	// 构建调色板生成命令
	paletteArgs := []string{
		"-i", inputPath,
		"-y",
	}

	// 时间参数
	if startTime > 0 {
		paletteArgs = append(paletteArgs, "-ss", fmt.Sprintf("%.2f", startTime))
	}
	if duration > 0 {
		paletteArgs = append(paletteArgs, "-t", fmt.Sprintf("%.2f", duration))
	}

	// 调色板滤镜 - 根据质量优化设置
	var paletteFilters []string
	if width > 0 {
		paletteFilters = append(paletteFilters, fmt.Sprintf("scale=%d:-2:flags=lanczos", width))
	} else {
		// 超高质量使用更高的默认分辨率
		if quality == "ultra" {
			paletteFilters = append(paletteFilters, "scale=720:-2:flags=lanczos")
		} else {
			paletteFilters = append(paletteFilters, "scale=480:-2:flags=lanczos")
		}
	}

	// 根据质量设置不同的参数
	var fps string
	switch quality {
	case "ultra": // 超高质量 - 最佳画质设置
		fps = "25"
		paletteFilters = append(paletteFilters, fmt.Sprintf("fps=%s", fps), "palettegen=max_colors=256:reserve_transparent=0:stats_mode=diff")
	case "high": // 高质量 - 提升效果
		fps = "18"                                                                                                                             // 提升帧率
		paletteFilters = append(paletteFilters, fmt.Sprintf("fps=%s", fps), "palettegen=max_colors=192:reserve_transparent=0:stats_mode=diff") // 增加颜色数和统计模式
	case "medium": // 中质量 - 使用原来高质量的参数
		fps = "15"                                                                                                             // 使用原来高质量的帧率
		paletteFilters = append(paletteFilters, fmt.Sprintf("fps=%s", fps), "palettegen=max_colors=128:reserve_transparent=0") // 使用原来高质量的设置
	case "low":
		fps = "8"
		paletteFilters = append(paletteFilters, fmt.Sprintf("fps=%s", fps), "palettegen=max_colors=32")
	default:
		fps = "15"                                                                                                             // 使用原来高质量的帧率作为默认
		paletteFilters = append(paletteFilters, fmt.Sprintf("fps=%s", fps), "palettegen=max_colors=128:reserve_transparent=0") // 使用原来高质量的设置
	}

	paletteArgs = append(paletteArgs, "-vf", strings.Join(paletteFilters, ","))
	paletteArgs = append(paletteArgs, paletteFile)

	// 生成调色板
	cmd := exec.Command("ffmpeg", paletteArgs...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("palette generation error: %v, output: %s", err, string(output))
	}

	// 第二步：使用调色板生成GIF
	gifArgs := []string{
		"-i", inputPath,
		"-i", paletteFile,
		"-y",
	}

	// 时间参数
	if startTime > 0 {
		gifArgs = append(gifArgs, "-ss", fmt.Sprintf("%.2f", startTime))
	}
	if duration > 0 {
		gifArgs = append(gifArgs, "-t", fmt.Sprintf("%.2f", duration))
	}

	// GIF生成滤镜 - 根据质量优化
	var gifFilters []string
	if width > 0 {
		gifFilters = append(gifFilters, fmt.Sprintf("scale=%d:-2:flags=lanczos", width))
	} else {
		// 根据质量设置不同的默认分辨率
		switch quality {
		case "ultra":
			gifFilters = append(gifFilters, "scale=720:-2:flags=lanczos")
		case "high":
			gifFilters = append(gifFilters, "scale=600:-2:flags=lanczos") // 提升高质量的默认分辨率
		default:
			gifFilters = append(gifFilters, "scale=480:-2:flags=lanczos")
		}
	}
	gifFilters = append(gifFilters, fmt.Sprintf("fps=%s", fps))

	// 根据质量选择抖动方式
	var ditherType string
	switch quality {
	case "ultra": // 超高质量 - 最佳抖动算法
		ditherType = "floyd_steinberg"
	case "high": // 高质量 - 提升抖动效果
		ditherType = "floyd_steinberg" // 使用最佳抖动算法
	case "medium": // 中质量 - 使用原来高质量的设置
		ditherType = "bayer:bayer_scale=2" // 使用原来高质量的抖动设置
	case "low":
		ditherType = "none" // 最小文件大小
	default:
		ditherType = "bayer:bayer_scale=2" // 使用原来高质量的抖动设置作为默认
	}

	filterComplex := fmt.Sprintf("[0:v]%s[v];[v][1:v]paletteuse=dither=%s", strings.Join(gifFilters, ","), ditherType)
	gifArgs = append(gifArgs, "-filter_complex", filterComplex)
	gifArgs = append(gifArgs, "-loop", "0")
	gifArgs = append(gifArgs, outputPath)

	// 生成GIF
	cmd = exec.Command("ffmpeg", gifArgs...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("gif generation error: %v, output: %s", err, string(output))
	}

	return nil
}

// GetVideoDuration 获取视频时长
func (f *FFmpegService) GetVideoDuration(inputPath string) (float64, error) {
	// 尝试多种方法获取视频时长

	// 方法1: 使用format=duration
	cmd := exec.Command("ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", inputPath)
	output, err := cmd.Output()
	if err == nil {
		durationStr := strings.TrimSpace(string(output))
		if durationStr != "" && durationStr != "N/A" {
			duration, parseErr := strconv.ParseFloat(durationStr, 64)
			if parseErr == nil && duration > 0 {
				return duration, nil
			}
		}
	}

	// 方法2: 使用stream=duration
	cmd = exec.Command("ffprobe", "-v", "quiet", "-show_entries", "stream=duration", "-of", "csv=p=0", inputPath)
	output, err = cmd.Output()
	if err == nil {
		durationStr := strings.TrimSpace(string(output))
		lines := strings.Split(durationStr, "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" && line != "N/A" {
				duration, parseErr := strconv.ParseFloat(line, 64)
				if parseErr == nil && duration > 0 {
					return duration, nil
				}
			}
		}
	}

	// 方法3: 使用mediainfo格式（如果前面都失败）
	cmd = exec.Command("ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", inputPath)
	output, err = cmd.Output()
	if err == nil {
		// 简单解析JSON中的duration字段
		outputStr := string(output)
		if idx := strings.Index(outputStr, `"duration"`); idx != -1 {
			remaining := outputStr[idx:]
			if colonIdx := strings.Index(remaining, ":"); colonIdx != -1 {
				remaining = remaining[colonIdx+1:]
				if commaIdx := strings.Index(remaining, ","); commaIdx != -1 {
					durationStr := strings.Trim(remaining[:commaIdx], ` "`)
					duration, parseErr := strconv.ParseFloat(durationStr, 64)
					if parseErr == nil && duration > 0 {
						return duration, nil
					}
				}
			}
		}
	}

	// 如果所有方法都失败，返回默认值
	return 10.0, fmt.Errorf("无法获取视频时长，使用默认值10秒")
}

// CheckFFmpegInstallation 检查FFmpeg是否安装
func (f *FFmpegService) CheckFFmpegInstallation() error {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		return fmt.Errorf("ffmpeg not found: %v", err)
	}
	if _, err := exec.LookPath("ffprobe"); err != nil {
		return fmt.Errorf("ffprobe not found: %v", err)
	}
	return nil
}

// GenerateUniqueFilename 生成唯一文件名
func GenerateUniqueFilename(extension string) string {
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%d.%s", timestamp, extension)
}

// GetFileSize 获取文件大小
func GetFileSize(filePath string) (int64, error) {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return 0, err
	}
	return fileInfo.Size(), nil
}

// CleanupOldFiles 清理旧文件
func CleanupOldFiles(dir string, maxAge time.Duration) error {
	return filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && time.Since(info.ModTime()) > maxAge {
			return os.Remove(path)
		}

		return nil
	})
}
