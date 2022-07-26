package main

import (
	"encoding/json"
	"net/http"
)

/* WEB HELPERS */
type ApiResponse[T any] struct {
	Success bool `json:"success"`
	Data    T    `json:"data"`
	Code    int  `json:"statusCode"`
}

func HandleResponse[T any](resp *http.ResponseWriter, code int, data ...T) {
	response := ApiResponse[T]{Code: code}

	if code >= 200 && code < 400 {
		response.Success = true
	}
	if len(data) > 0 {
		response.Data = data[0]
	}

	(*resp).Header().Set("Content-Type", "application/json")
	(*resp).WriteHeader(code)
	enableCors(resp)

	json.NewEncoder(*resp).Encode(response)
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}
