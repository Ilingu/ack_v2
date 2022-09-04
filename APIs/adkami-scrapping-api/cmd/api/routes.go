package main

import (
	"adkami-scrapping-api/cmd/caching"
	"adkami-scrapping-api/cmd/scrapping"
	"adkami-scrapping-api/cmd/updates"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

func (app *AppConfig) routes() http.Handler {
	var mux http.ServeMux

	mux.HandleFunc("/getLatestEps", getAdkamiLastestEps)

	mux.HandleFunc("/animeUpdates", HandleReceiveCron)
	mux.HandleFunc("/subscribeToUpdates", subscribeToUpdates)

	return &mux
}

func subscribeToUpdates(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		HandleResponse(&w, http.StatusBadRequest, "invalid method")
		return
	}

	rawUrlToSub := r.URL.Query().Get("callbackurl")
	urlToSub, err := url.QueryUnescape(rawUrlToSub)
	if err != nil {
		HandleResponse(&w, http.StatusBadRequest, "invalid url")
		return
	}

	success := updates.SubscribedEndpoints.Subscribe(urlToSub)
	HandleResponse(&w, http.StatusOK, strconv.FormatBool(success)) // or fmt.Sprint(success)
}

func getAdkamiLastestEps(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		HandleResponse(&w, http.StatusBadRequest, "invalid method")
		return
	}

	// Checking if there is cache...
	cachedDatas, ok := caching.ReadCachingFile(false)
	if ok {
		HandleResponse(&w, http.StatusOK, cachedDatas) // ✅
		log.Println("[LOG] Datas returned from Cache ⚡")
		return
	}

	// No Cache... Fetch
	log.Println("[LOG] No Cache, fetching datas from ADKami...")
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
	go caching.CacheNewEpsDatas(AdkamiLatestEps)
}
