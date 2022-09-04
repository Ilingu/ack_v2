package caching

import (
	"adkami-scrapping-api/cmd/scrapping"
	"encoding/json"
	"log"
	"os"
)

const FilePath = "../../cache.json"

func ReadCachingFile() ([]scrapping.AdkamiNewEpisodeShape, bool) {
	file, err := os.OpenFile(FilePath, os.O_CREATE, os.ModePerm)
	if err != nil {
		log.Println("[LOG][CACHE] Cannot open file (read)")
		return nil, false
	}
	defer file.Close()

	var CachedDatas []scrapping.AdkamiNewEpisodeShape
	decoderErr := json.NewDecoder(file).Decode(&CachedDatas)
	if decoderErr != nil {
		log.Println("[LOG][CACHE] Cannot read file")
		return nil, false
	}

	if len(CachedDatas) <= 0 {
		log.Println("[LOG][CACHE] No Cached Datas")
		return nil, false // datas lost
	}
	return CachedDatas, true
}

func CacheNewEpsDatas(datas []scrapping.AdkamiNewEpisodeShape) {
	jsonObj, err := json.Marshal(datas)
	if err != nil {
		log.Println("Cannot open file (write)")
		return
	}

	err = os.WriteFile(FilePath, jsonObj, os.ModePerm)
	if err != nil {
		log.Println("Cannot write file")
	}
}
