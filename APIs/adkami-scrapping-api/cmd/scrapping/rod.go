package scrapping

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/PuerkitoBio/goquery"
)

type AdkamiNewEpisodeShape struct {
	Title        string // Black Clover
	EpisodeId    string // Episode 28 vostfr
	TimeReleased string // 28min ago
	Img          string // Img of anime
	Team         string // Wakanim
}

func IsScrapApiError(doc *goquery.Document) bool {
	return doc.Find("pre").Length() >= 1
}

const ADKamiURL = "https://www.adkami.com/"

func FetchAdkamiLatestEps() ([]AdkamiNewEpisodeShape, error) {
	ScrappingURL := fmt.Sprintf("https://api.scraperbox.com/scrape?token=%s&proxy_location=fr&residential_proxy=true&url=%s", os.Getenv("WEBSCAPPING_APIKEY"), url.QueryEscape(ADKamiURL))
	adkamiResp, err := http.Get(ScrappingURL)
	if err != nil {
		log.Fatal(err)
	}
	defer adkamiResp.Body.Close()
	if adkamiResp.StatusCode != 200 {
		log.Fatalf("status code error: %d %s", adkamiResp.StatusCode, adkamiResp.Status)
	}

	// Load the HTML document
	htmlDoc, err := goquery.NewDocumentFromReader(adkamiResp.Body)
	if err != nil {
		log.Fatal(err)
	}

	if IsScrapApiError(htmlDoc) {
		return nil, errors.New("error when requesting scrapping api")
	}

	LastDOMEpList := htmlDoc.Find(".video-item-list") // search input
	AdkamiNewEpisodes := make([]AdkamiNewEpisodeShape, 0)
	if LastDOMEpList.Length() <= 0 {
		return nil, errors.New("cannot query the items")
	}

	LastDOMEpList.Each(func(_ int, DOMEp *goquery.Selection) {
		// Parents
		ImgParent := DOMEp.Find(".img")
		TopParent := DOMEp.Find(".top")
		InfoParent := DOMEp.Find(".info")

		// Data
		Title := TopParent.Find("a .title").Text()
		EpisodeId := TopParent.Find(".episode").Text()
		TimeReleased := InfoParent.Find(".date").Text()
		Img, _ := ImgParent.Find("img").Attr("data-original")
		Team := TopParent.Find(".team").Text()

		NewEp := AdkamiNewEpisodeShape{Title: Title, EpisodeId: EpisodeId, TimeReleased: TimeReleased, Img: Img, Team: Team}
		AdkamiNewEpisodes = append(AdkamiNewEpisodes, NewEp)
	})

	return AdkamiNewEpisodes, nil
}
