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

	RespCh, ErrCh := make(chan string), make(chan error)
	go scrapping.ScrappingConfig(args).Fetch9AnimeLink(RespCh, ErrCh) // using goroutine to handle multiple browser at same time

	select {
	case err := <-ErrCh:
		HandleResponse(&w, http.StatusBadRequest, err.Error()) // ❌
		return
	case NineAnimeUrl := <-RespCh:
		HandleResponse(&w, http.StatusOK, NineAnimeUrl) // ✅
	}
}
