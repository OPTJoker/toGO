package utils

import (
	"log"
	"os"
	"path/filepath"
	"time"
)

// CleanupService 文件清理服务
type CleanupService struct {
	uploadsDir string
	outputDir  string
}

// NewCleanupService 创建文件清理服务
func NewCleanupService(uploadsDir, outputDir string) *CleanupService {
	return &CleanupService{
		uploadsDir: uploadsDir,
		outputDir:  outputDir,
	}
}

// StartCleanupRoutine 启动定时清理任务
func (cs *CleanupService) StartCleanupRoutine() {
	// 每小时执行一次清理
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		defer ticker.Stop()
		for range ticker.C {
			cs.CleanupOldFiles()
		}
	}()
}

// CleanupOldFiles 清理过期文件
func (cs *CleanupService) CleanupOldFiles() {
	log.Println("开始清理过期文件...")

	// 清理超过24小时的上传文件
	cs.cleanupDirectory(cs.uploadsDir, 24*time.Hour)

	// 清理超过12小时的输出文件
	cs.cleanupDirectory(cs.outputDir, 12*time.Hour)

	log.Println("文件清理完成")
}

// cleanupDirectory 清理指定目录中的过期文件
func (cs *CleanupService) cleanupDirectory(dir string, maxAge time.Duration) {
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 跳过目录
		if info.IsDir() {
			return nil
		}

		// 检查文件年龄
		if time.Since(info.ModTime()) > maxAge {
			log.Printf("删除过期文件: %s", path)
			os.Remove(path)
		}

		return nil
	})

	if err != nil {
		log.Printf("清理目录 %s 时出错: %v", dir, err)
	}
}

// GetDiskUsage 获取磁盘使用情况
func (cs *CleanupService) GetDiskUsage() (uploadsSize, outputSize int64, err error) {
	uploadsSize, err = cs.getDirSize(cs.uploadsDir)
	if err != nil {
		return 0, 0, err
	}

	outputSize, err = cs.getDirSize(cs.outputDir)
	if err != nil {
		return uploadsSize, 0, err
	}

	return uploadsSize, outputSize, nil
}

// getDirSize 计算目录大小
func (cs *CleanupService) getDirSize(path string) (int64, error) {
	var size int64

	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})

	return size, err
}

// ForceCleanup 强制清理所有临时文件
func (cs *CleanupService) ForceCleanup() error {
	log.Println("执行强制清理...")

	// 清理所有上传文件
	cs.cleanupDirectory(cs.uploadsDir, 0)

	// 保留最近1小时的输出文件
	cs.cleanupDirectory(cs.outputDir, 1*time.Hour)

	return nil
}
