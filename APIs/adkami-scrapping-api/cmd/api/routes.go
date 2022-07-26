package main

import (
	"adkami-scrapping-api/cmd/scrapping"
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

	AdkamiLatestEps := scrapping.FetchAdkamiLatestEps()
	if AdkamiLatestEps == nil || len(AdkamiLatestEps) <= 0 {
		HandleResponse(&w, http.StatusBadRequest, "no animes returned")
		return
	}
	HandleResponse(&w, http.StatusOK, AdkamiLatestEps) // ✅
}
