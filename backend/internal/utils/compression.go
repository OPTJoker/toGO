package utils

import (
	"archive/zip"
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// CompressionService 压缩服务
type CompressionService struct{}

// NewCompressionService 创建压缩服务实例
func NewCompressionService() *CompressionService {
	return &CompressionService{}
}

// CompressData 压缩数据
func (cs *CompressionService) CompressData(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	gzWriter := gzip.NewWriter(&buf)

	_, err := gzWriter.Write(data)
	if err != nil {
		return nil, fmt.Errorf("压缩数据失败: %v", err)
	}

	err = gzWriter.Close()
	if err != nil {
		return nil, fmt.Errorf("关闭压缩器失败: %v", err)
	}

	return buf.Bytes(), nil
}

// DecompressData 解压缩数据
func (cs *CompressionService) DecompressData(compressedData []byte) ([]byte, error) {
	reader, err := gzip.NewReader(bytes.NewReader(compressedData))
	if err != nil {
		return nil, fmt.Errorf("创建解压缩器失败: %v", err)
	}
	defer reader.Close()

	decompressed, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("解压缩数据失败: %v", err)
	}

	return decompressed, nil
}

// CompressFile 压缩文件
func (cs *CompressionService) CompressFile(inputPath, outputPath string) error {
	inputFile, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("打开输入文件失败: %v", err)
	}
	defer inputFile.Close()

	outputFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建输出文件失败: %v", err)
	}
	defer outputFile.Close()

	gzWriter := gzip.NewWriter(outputFile)
	defer gzWriter.Close()

	_, err = io.Copy(gzWriter, inputFile)
	if err != nil {
		return fmt.Errorf("压缩文件失败: %v", err)
	}

	return nil
}

// DecompressFile 解压缩文件
func (cs *CompressionService) DecompressFile(inputPath, outputPath string) error {
	inputFile, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("打开输入文件失败: %v", err)
	}
	defer inputFile.Close()

	gzReader, err := gzip.NewReader(inputFile)
	if err != nil {
		return fmt.Errorf("创建解压缩器失败: %v", err)
	}
	defer gzReader.Close()

	outputFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建输出文件失败: %v", err)
	}
	defer outputFile.Close()

	_, err = io.Copy(outputFile, gzReader)
	if err != nil {
		return fmt.Errorf("解压缩文件失败: %v", err)
	}

	return nil
}

// CompressToBase64 压缩并编码为Base64
func (cs *CompressionService) CompressToBase64(data []byte) (string, error) {
	compressed, err := cs.CompressData(data)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(compressed), nil
}

// DecompressFromBase64 从Base64解码并解压缩
func (cs *CompressionService) DecompressFromBase64(base64Data string) ([]byte, error) {
	compressed, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return nil, fmt.Errorf("Base64解码失败: %v", err)
	}

	return cs.DecompressData(compressed)
}

// CreateZipArchive 创建ZIP压缩包
func (cs *CompressionService) CreateZipArchive(files []string, outputPath string) error {
	zipFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建ZIP文件失败: %v", err)
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	for _, filePath := range files {
		err := cs.addFileToZip(zipWriter, filePath)
		if err != nil {
			return fmt.Errorf("添加文件到ZIP失败: %v", err)
		}
	}

	return nil
}

// addFileToZip 添加文件到ZIP压缩包
func (cs *CompressionService) addFileToZip(zipWriter *zip.Writer, filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// 获取文件信息
	info, err := file.Stat()
	if err != nil {
		return err
	}

	// 创建ZIP文件头
	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}

	// 使用文件名作为ZIP内的路径
	header.Name = filepath.Base(filePath)
	header.Method = zip.Deflate

	// 创建ZIP文件写入器
	writer, err := zipWriter.CreateHeader(header)
	if err != nil {
		return err
	}

	// 复制文件内容
	_, err = io.Copy(writer, file)
	return err
}

// ExtractZipArchive 解压ZIP压缩包
func (cs *CompressionService) ExtractZipArchive(zipPath, destDir string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("打开ZIP文件失败: %v", err)
	}
	defer reader.Close()

	// 确保目标目录存在
	err = os.MkdirAll(destDir, 0755)
	if err != nil {
		return fmt.Errorf("创建目标目录失败: %v", err)
	}

	// 解压文件
	for _, file := range reader.File {
		err := cs.extractFileFromZip(file, destDir)
		if err != nil {
			return fmt.Errorf("解压文件失败: %v", err)
		}
	}

	return nil
}

// extractFileFromZip 从ZIP中解压单个文件
func (cs *CompressionService) extractFileFromZip(file *zip.File, destDir string) error {
	// 构建目标路径
	path := filepath.Join(destDir, file.Name)

	// 检查路径安全性（防止路径遍历攻击）
	if !strings.HasPrefix(path, filepath.Clean(destDir)+string(os.PathSeparator)) {
		return fmt.Errorf("无效的文件路径: %s", file.Name)
	}

	// 创建目录
	if file.FileInfo().IsDir() {
		return os.MkdirAll(path, file.FileInfo().Mode())
	}

	// 确保父目录存在
	err := os.MkdirAll(filepath.Dir(path), 0755)
	if err != nil {
		return err
	}

	// 打开ZIP中的文件
	fileReader, err := file.Open()
	if err != nil {
		return err
	}
	defer fileReader.Close()

	// 创建目标文件
	targetFile, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.FileInfo().Mode())
	if err != nil {
		return err
	}
	defer targetFile.Close()

	// 复制内容
	_, err = io.Copy(targetFile, fileReader)
	return err
}

// GetCompressionRatio 计算压缩率
func (cs *CompressionService) GetCompressionRatio(originalSize, compressedSize int64) float64 {
	if originalSize == 0 {
		return 0
	}
	return float64(compressedSize) / float64(originalSize) * 100
}

// IsFileCompressed 检查文件是否已压缩
func (cs *CompressionService) IsFileCompressed(filePath string) bool {
	ext := strings.ToLower(filepath.Ext(filePath))
	compressedExts := []string{".gz", ".zip", ".rar", ".7z", ".tar", ".bz2"}

	for _, compressedExt := range compressedExts {
		if ext == compressedExt {
			return true
		}
	}
	return false
}

// IsGzipFile 检查文件是否为Gzip压缩格式（通过文件内容检测）
func (cs *CompressionService) IsGzipFile(filePath string) bool {
	file, err := os.Open(filePath)
	if err != nil {
		return false
	}
	defer file.Close()

	// 读取文件头部的魔法字节
	header := make([]byte, 2)
	_, err = file.Read(header)
	if err != nil {
		return false
	}

	// Gzip文件的魔法字节是 0x1f 0x8b
	return header[0] == 0x1f && header[1] == 0x8b
}

// IsFileCompressedContent 通过文件内容检查是否为压缩文件
func (cs *CompressionService) IsFileCompressedContent(filePath string) bool {
	// 先检查扩展名
	if cs.IsFileCompressed(filePath) {
		return true
	}

	// 再检查文件内容是否为Gzip格式
	return cs.IsGzipFile(filePath)
}
