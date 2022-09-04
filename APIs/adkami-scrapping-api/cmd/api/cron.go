package main

import (
	"adkami-scrapping-api/cmd/updates"
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type PayloadShape struct {
	Frequency   string `json:"Frequency"`
	CallbackUrl string `json:"CallbackUrl"`
}

func RegisterCron() {
	url, callbackUrl := "http://localhost:3001", "http://localhost:3000/animeUpdates"
	if os.Getenv("APP_MODE") == "prod" {
		url = "https://cronapi.up.railway.app"
		callbackUrl = "https://adkami-scapping-api.up.railway.app/animeUpdates"
	}

	bodyPayload := PayloadShape{
		Frequency:   "@every 12h", // 2 call/day, 60.875 call/month, 1 call = 10 scrappingapi credit so 608.75 credit consumed/month (out of 1000 credits...)
		CallbackUrl: callbackUrl,
	}

	body, err := json.Marshal(bodyPayload)
	if err != nil {
		log.Println("Failed to Register Cron ❌")
		return
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		log.Println("Failed To Create Cron Register Request ❌")
		return
	}
	req.Header = http.Header{"Content-Type": []string{"application/json"}, "Authorization": []string{os.Getenv("CRON_API_KEY")}}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("Cron Register Request Failed ❌")
		return
	}

	if resp.StatusCode < 400 {
		log.Println("Cron Register Request Succeed ✅")
	} else {
		log.Println("Cron Register Request Failed ❌")
	}
}

func HandleReceiveCron(resp http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		HandleResponse(&resp, http.StatusBadRequest, "invalid method")
		return
	}

	go func() {
		newEp := updates.QueryUpdate()
		updates.SubscribedEndpoints.DispatchUpdate(newEp)
	}()

	AllowedOrigin := "https://cronapi.up.railway.app"
	if os.Getenv("APP_MODE") != "prod" {
		AllowedOrigin = "http://localhost:3001"
	}

	resp.Header().Set("Access-Control-Allow-Origin", AllowedOrigin) // Cors
	resp.Header().Set("Access-Control-Expose-Headers", "Continue")
	resp.Header().Set("Content-Type", "text/plain")
	resp.Header().Set("Continue", "true")
	resp.WriteHeader(200)

	resp.Write([]byte{})
}
