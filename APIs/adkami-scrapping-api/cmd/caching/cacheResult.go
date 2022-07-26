package caching

import (
	"adkami-scrapping-api/cmd/scrapping"
	"encoding/json"
	"os"
	"time"
)

type CachedJSON struct {
	ExpireDate int64
	Datas      []scrapping.AdkamiNewEpisodeShape
}

const FilePath = "../../cache.json"

func ReadCachingFile() ([]scrapping.AdkamiNewEpisodeShape, bool) {
	file, _ := os.Open(FilePath)
	defer file.Close()

	var CachedDatas CachedJSON
	decoderErr := json.NewDecoder(file).Decode(&CachedDatas)
	if decoderErr != nil {
		return nil, false
	}

	if CachedDatas.ExpireDate <= time.Now().UnixMilli() || len(CachedDatas.Datas) <= 0 {
		return nil, false // cache expired or data lost
	}

	return CachedDatas.Datas, true
}

func CacheNewEpsDatas(datas []scrapping.AdkamiNewEpisodeShape) {
	CachedDatasObj := CachedJSON{
		ExpireDate: time.Now().UnixMilli() + 7200000, // 2H in milli
		Datas:      datas,
	}

	file, _ := os.OpenFile(FilePath, os.O_CREATE, os.ModePerm)
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.Encode(CachedDatasObj) // write data
}
