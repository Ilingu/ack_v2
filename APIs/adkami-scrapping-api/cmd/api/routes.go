package main

import (
	"adkami-scrapping-api/cmd/caching"
	"adkami-scrapping-api/cmd/scrapping"
	"log"
	"net/http"
)

func (app *AppConfig) routes() http.Handler {
	var mux http.ServeMux
	mux.HandleFunc("/getLatestEps", getAdkamiLastestEps)

	return &mux
}

func getAdkamiLastestEps(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		HandleResponse(&w, http.StatusBadRequest, "invalid method")
		return
	}
	cacheHandler := caching.NewCacheHandler() // open cache

	// Checking if there is cache...
	cachedDatas, ok := cacheHandler.ReadCache()
	if ok {
		HandleResponse(&w, http.StatusOK, cachedDatas) // ✅
		log.Println("From Cache ⚡")
		return
	}

	// No Cache... Fetch
	AdkamiLatestEps, err := scrapping.FetchAdkamiLatestEps()
	if err != nil {
		HandleResponse(&w, http.StatusBadRequest, err.Error())
		return
	}
	if err != nil || AdkamiLatestEps == nil || len(AdkamiLatestEps) <= 0 {
		HandleResponse(&w, http.StatusBadRequest, "no animes returned")
		return
	}
	HandleResponse(&w, http.StatusOK, AdkamiLatestEps) // ✅

	// Cache result
	go cacheHandler.WriteCache(AdkamiLatestEps)
}
