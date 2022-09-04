package utils

import (
	"crypto/sha256"
	"fmt"
	"net/url"
	"strings"
)

func Hash(str string) string {
	ByteHash := sha256.Sum256([]byte(str))
	HashedPassword := fmt.Sprintf("%x", ByteHash[:])
	return HashedPassword
}

func IsEmptyString(strToCheck any) bool {
	if str, ok := strToCheck.(string); ok {
		return len(strings.TrimSpace(str)) <= 0
	}
	return false
}

func IsValidUrl(URL string) bool {
	_, err := url.ParseRequestURI(URL)
	return err == nil
}

func ReverseSlice[E any, T []E](slice T) T {
	var output T
	for i := len(slice) - 1; i >= 0; i-- {
		output = append(output, slice[i])
	}
	return output
}
