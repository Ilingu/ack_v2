package caching

import (
	"adkami-scrapping-api/cmd/scrapping"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
)

const REDIS_CACHE_KEY = "AdkamiLatestEpisodesCache"

type CachedJSON struct {
	ExpireDate int64
	Datas      []scrapping.AdkamiNewEpisodeShape
}

var fastRAMCache CachedJSON

type CacheHandler struct {
	redis *redis.Client
}

var ctx = context.Background()

func newRedisClient() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_URL"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0, // use default DB
	})
}

func NewCacheHandler() *CacheHandler {
	return &CacheHandler{redis: newRedisClient()}
}

func (cache *CacheHandler) ReadCache() ([]scrapping.AdkamiNewEpisodeShape, bool) {
	cachedRam, ok := cache.ReadFastCache()
	if ok {
		return cachedRam, ok
	}

	cachedRedis, err := cache.ReadRedisCache()
	if err != nil {
		return nil, false
	}

	return cachedRedis, true
}

func (cache *CacheHandler) WriteCache(datas []scrapping.AdkamiNewEpisodeShape) bool {
	cache.WriteFastCache(datas)
	err := cache.WriteRedisCache(datas)

	return err == nil
}

func (cache *CacheHandler) ReadRedisCache() ([]scrapping.AdkamiNewEpisodeShape, error) {
	resp, err := cache.redis.Get(ctx, REDIS_CACHE_KEY).Bytes()
	if err != nil {
		log.Println("No Cache Found")
		return nil, err
	}

	var CachedDatas CachedJSON
	err = json.NewDecoder(bytes.NewBuffer(resp)).Decode(&CachedDatas)
	if err != nil {
		return nil, err
	}

	if HasExpired(CachedDatas.ExpireDate) || len(CachedDatas.Datas) <= 0 {
		log.Println("cache has expired")
		return nil, errors.New("cache has expired") // cache expired or data lost
	}

	go cache.WriteFastCache(CachedDatas.Datas) // save result in fast cache
	return CachedDatas.Datas, nil
}

func (cache *CacheHandler) WriteRedisCache(datas []scrapping.AdkamiNewEpisodeShape) error {
	CachedJSONPayload := CachedJSON{
		ExpireDate: time.Now().UnixMilli() + 7200000, // 2H in milli
		Datas:      datas,
	}

	dataBuffer := new(bytes.Buffer)
	err := json.NewEncoder(dataBuffer).Encode(CachedJSONPayload)
	if err != nil {
		log.Println("Cannot Write Redis")
		return err
	}

	return cache.redis.Set(ctx, REDIS_CACHE_KEY, dataBuffer.Bytes(), 2*time.Hour).Err()
}

func (cache *CacheHandler) ReadFastCache() ([]scrapping.AdkamiNewEpisodeShape, bool) {
	if fastRAMCache.Datas == nil {
		return nil, false // cache has been garbage collected
	}

	if HasExpired(fastRAMCache.ExpireDate) || len(fastRAMCache.Datas) <= 0 {
		log.Println("fast cache has expired")
		return nil, false // cache expired or data lost
	}

	return fastRAMCache.Datas, true
}

func (cache *CacheHandler) WriteFastCache(datas []scrapping.AdkamiNewEpisodeShape) {
	fastRAMCache = CachedJSON{
		ExpireDate: time.Now().UnixMilli() + 7200000, // 2H in milli
		Datas:      datas,
	}
}
