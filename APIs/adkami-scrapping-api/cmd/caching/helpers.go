package caching

import "time"

func HasExpired(ExpireTime int64) bool {
	return ExpireTime <= time.Now().UnixMilli()
}
