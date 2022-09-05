package updates

import (
	"adkami-scrapping-api/cmd/scrapping"
	"adkami-scrapping-api/cmd/utils"
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"sync"
)

type subscriber map[string]bool

var SubscribedEndpoints = subscriber{}
var subEndpointsMutex sync.Mutex

func (subscriber) Subscribe(URL string) bool {
	if utils.IsEmptyString(URL) || !utils.IsValidUrl(URL) {
		return false
	}

	if _, exist := SubscribedEndpoints[URL]; exist {
		return true
	}

	SubscribedEndpoints[URL] = true
	log.Printf("[LOG] New Subscriber: \"%s\"\n", URL)

	return true
}

func (subscriber) Unsubscribe(URL string) bool {
	if utils.IsEmptyString(URL) || !utils.IsValidUrl(URL) {
		return false
	}

	_, exist := SubscribedEndpoints[URL]
	if !exist {
		return false
	}

	delete(SubscribedEndpoints, URL)
	log.Printf("[LOG] \"%s\" has unsubscribed\n", URL)

	return true
}

func (subscriber) DispatchUpdate(datas []scrapping.AdkamiNewEpisodeShape) {
	log.Println("[LOG] New Anime Update!")
	if len(datas) <= 0 {
		log.Println("[LOG] New Anime Update Abortted ❌ No Updates")
		return
	}

	var wg sync.WaitGroup

	wg.Add(len(SubscribedEndpoints))
	for SubURL := range SubscribedEndpoints {
		go func(URL string) {
			defer wg.Done()

			body, err := json.Marshal(datas)
			if err != nil {
				body = []byte{}
			}

			resp, err := http.Post(URL, "text/plain", bytes.NewBuffer(body))
			log.Printf("[LOG] Anime Update Successfully Dispatched to \"%s\" ✅\n", URL)

			if err != nil || resp.StatusCode != http.StatusOK || resp.Header.Get("Continue") != "true" {
				subEndpointsMutex.Lock() // not best solution, but still better than an unexpected race condition
				delete(SubscribedEndpoints, URL)
				subEndpointsMutex.Unlock()
			}
		}(SubURL)
	}
	wg.Wait()
}
