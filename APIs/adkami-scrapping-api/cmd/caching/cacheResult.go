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

type RedisCache struct {
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

func NewCache() *RedisCache {
	return &RedisCache{redis: newRedisClient()}
}

func (cache *RedisCache) ReadCache() ([]scrapping.AdkamiNewEpisodeShape, error) {
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

	if CachedDatas.ExpireDate <= time.Now().UnixMilli() || len(CachedDatas.Datas) <= 0 {
		log.Println("cache has expired")
		return nil, errors.New("cache has expired") // cache expired or data lost
	}

	return CachedDatas.Datas, nil
}

func (cache *RedisCache) WriteCache(datas []scrapping.AdkamiNewEpisodeShape) error {
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
