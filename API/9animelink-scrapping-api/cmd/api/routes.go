package main

import (
	"net/http"
	"nine-anime-link/cmd/scrapping"
)

func (app *AppConfig) routes() http.Handler {
	var mux http.ServeMux
	mux.HandleFunc("/getLink", get9AnimeLink)

	return &mux
}

func get9AnimeLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		HandleResponse(&w, http.StatusBadRequest, "invalid method")
		return
	}

	query := r.URL.Query()
	args, err := parseQuery(query)
	if err != nil {
		HandleResponse(&w, http.StatusBadRequest, err.Error()) // ❌
		return
	}

	NineAnimeUrl, err := scrapping.ScrappingConfig(args).Fetch9AnimeLink()
	if err != nil {
		HandleResponse(&w, http.StatusBadRequest, err.Error()) // ❌
		return
	}
	HandleResponse(&w, http.StatusOK, NineAnimeUrl) // ✅
}
