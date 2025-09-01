package config

import (
	"os"
	"strconv"
)

// AppConfig 应用配置
type AppConfig struct {
	ServerPort  string
	BaseURL     string
	StaticURL   string
	Environment string
	// 数据库配置
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

var Config *AppConfig

// LoadConfig 加载配置
func LoadConfig() *AppConfig {
	if Config != nil {
		return Config
	}

	// 从环境变量获取端口，默认为8080
	port := getEnv("PORT", "8080")

	// 从环境变量获取基础URL
	baseURL := getEnv("BASE_URL", "")
	if baseURL == "" {
		// 如果没有设置BASE_URL，根据环境自动生成
		env := getEnv("ENVIRONMENT", "production")
		if env == "production" {
			// 生产环境使用相对路径
			baseURL = ""
		} else {
			// 开发环境使用localhost
			baseURL = "http://localhost:" + port
		}
	}

	// 静态文件URL
	staticURL := getEnv("STATIC_URL", baseURL+"/static")

	Config = &AppConfig{
		ServerPort:  port,
		BaseURL:     baseURL,
		StaticURL:   staticURL,
		Environment: getEnv("ENVIRONMENT", "production"),
		// 数据库配置
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "toGO"),
	}

	return Config
}

// GetBaseURL 获取基础URL
func GetBaseURL() string {
	if Config == nil {
		LoadConfig()
	}
	return Config.BaseURL
}

// GetStaticURL 获取静态文件URL
func GetStaticURL() string {
	if Config == nil {
		LoadConfig()
	}
	return Config.StaticURL
}

// BuildStaticURL 构建静态文件完整URL
func BuildStaticURL(filename string) string {
	staticURL := GetStaticURL()
	if staticURL == "" {
		return "/static/" + filename
	}
	return staticURL + "/" + filename
}

// IsProduction 判断是否为生产环境
func IsProduction() bool {
	if Config == nil {
		LoadConfig()
	}
	return Config.Environment == "production"
}

// IsDevelopment 判断是否为开发环境
func IsDevelopment() bool {
	if Config == nil {
		LoadConfig()
	}
	return Config.Environment == "development"
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt 获取环境变量并转换为int，如果不存在或转换失败则返回默认值
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsBool 获取环境变量并转换为bool，如果不存在则返回默认值
func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
