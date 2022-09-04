package caching

import (
	"adkami-scrapping-api/cmd/scrapping"
	"encoding/json"
	"log"
	"os"
	"time"
)

type CachedJSON struct {
	ExpireDate int64
	Datas      []scrapping.AdkamiNewEpisodeShape
}

const FilePath = "../../cache.json"

func ReadCachingFile(allowExpire bool) ([]scrapping.AdkamiNewEpisodeShape, bool) {
	file, err := os.OpenFile(FilePath, os.O_CREATE, os.ModePerm)
	if err != nil {
		log.Println("Cannot open file (read)")
		return nil, false
	}
	defer file.Close()

	var CachedDatas CachedJSON
	decoderErr := json.NewDecoder(file).Decode(&CachedDatas)
	if decoderErr != nil {
		log.Println("Cannot read file")
		return nil, false
	}

	if len(CachedDatas.Datas) <= 0 {
		return nil, false // datas lost
	}
	if !allowExpire && CachedDatas.ExpireDate <= time.Now().UnixMilli() {
		return nil, false // cache expired
	}

	return CachedDatas.Datas, true
}

func CacheNewEpsDatas(datas []scrapping.AdkamiNewEpisodeShape) {
	CachedDatasObj := CachedJSON{
		ExpireDate: time.Now().UnixMilli() + 7200000, // 2H in milli
		Datas:      datas,
	}

	jsonObj, err := json.Marshal(CachedDatasObj)
	if err != nil {
		log.Println("Cannot open file (write)")
		return
	}

	err = os.WriteFile(FilePath, jsonObj, os.ModePerm)
	if err != nil {
		log.Println("Cannot write file")
	}
}
