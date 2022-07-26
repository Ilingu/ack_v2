package caching

import (
	"adkami-scrapping-api/cmd/scrapping"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"time"
)

type CachedJSON struct {
	ExpireDate int64
	Datas      []scrapping.AdkamiNewEpisodeShape
}

const FilePath = "../../cache.json"

func ReadCachingFile() ([]scrapping.AdkamiNewEpisodeShape, bool) {
	file, err := os.Open(FilePath)
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

	jsonObj, err := json.Marshal(CachedDatasObj)
	if err != nil {
		log.Println("Cannot open file (write)")
		return
	}

	err = ioutil.WriteFile(FilePath, jsonObj, os.ModePerm)
	if err != nil {
		log.Println("Cannot write file")
	}
}
