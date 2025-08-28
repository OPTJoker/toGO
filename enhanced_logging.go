package main

import (
	"fmt"
	"log"
	"os"
	"time"
)

// 增强的日志记录器
type EnhancedLogger struct {
	*log.Logger
	logFile *os.File
}

// 创建增强日志记录器
func NewEnhancedLogger(filename string) (*EnhancedLogger, error) {
	// 创建日志目录
	if err := os.MkdirAll("logs", 0755); err != nil {
		return nil, err
	}

	// 创建日志文件
	logPath := fmt.Sprintf("logs/%s_%s.log", filename, time.Now().Format("2006-01-02"))
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, err
	}

	logger := log.New(file, "", log.LstdFlags|log.Lshortfile)

	return &EnhancedLogger{
		Logger:  logger,
		logFile: file,
	}, nil
}

// 关闭日志文件
func (el *EnhancedLogger) Close() error {
	if el.logFile != nil {
		return el.logFile.Close()
	}
	return nil
}

// 记录API请求
func (el *EnhancedLogger) LogAPIRequest(method, path, clientIP, userAgent string, statusCode int, duration time.Duration) {
	el.Printf("[API] %s %s | IP: %s | Status: %d | Duration: %v | UserAgent: %s",
		method, path, clientIP, statusCode, duration, userAgent)
}

// 记录数据库操作
func (el *EnhancedLogger) LogDBOperation(operation, table string, success bool, err error) {
	if success {
		el.Printf("[DB] %s %s - SUCCESS", operation, table)
	} else {
		el.Printf("[DB] %s %s - FAILED: %v", operation, table, err)
	}
}

// 记录错误
func (el *EnhancedLogger) LogError(component, operation string, err error) {
	el.Printf("[ERROR] %s.%s: %v", component, operation, err)
}

// 记录警告
func (el *EnhancedLogger) LogWarning(component, message string) {
	el.Printf("[WARNING] %s: %s", component, message)
}

// 记录信息
func (el *EnhancedLogger) LogInfo(component, message string) {
	el.Printf("[INFO] %s: %s", component, message)
}
