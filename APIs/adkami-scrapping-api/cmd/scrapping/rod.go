package scrapping

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/stealth"
)

func newBrowser() (*rod.Browser, error) {
	if os.Getenv("APP_MODE") != "prod" {
		return rod.New().Timeout(time.Minute).MustConnect().MustIncognito().NoDefaultDevice(), nil // In dev
	}

	// In prod
	path, ok := launcher.LookPath() // looking for the chromium executable path
	if !ok {
		return nil, errors.New("cannot find the chromium executable")
	}

	l := launcher.New().Bin(path)
	l.Headless(true).Set("no-sandbox").Set("disable-setuid-sandbox").Set("disable-dev-shm-usage").Set("disable-gpu")
	return rod.New().Timeout(time.Minute).ControlURL(l.MustLaunch()).MustConnect().MustIncognito().NoDefaultDevice(), nil
}

type AdkamiNewEpisodeShape struct {
	Title        string // Black Clover
	EpisodeId    string // Episode 28 vostfr
	TimeReleased string // 28min ago
	Img          string // Img of anime
	Team         string // Wakanim
}

func FetchAdkamiLatestEps() []AdkamiNewEpisodeShape {
	log.Println("Fecthing New Eps...")
	browser, err := newBrowser()
	if err != nil {
		log.Println(err)
		return nil
	}
	defer browser.MustClose()

	SearchPage := stealth.MustPage(browser)

	ADKamiURL := "https://www.adkami.com/"
	ScrappingURL := fmt.Sprintf("https://api.scraperbox.com/scrape?token=%s&proxy_location=fr&residential_proxy=true&url=%s", os.Getenv("WEBSCAPPING_APIKEY"), url.QueryEscape(ADKamiURL))

	log.Printf("Go at: %s", ScrappingURL)
	SearchPage.MustNavigate(ScrappingURL)
	SearchPage.MustWaitLoad()

	LastDOMEpList := SearchPage.Timeout(2 * time.Second).MustElements(`#indexpage .video-item-list.up`) // search input
	AdkamiNewEpisodes := make([]AdkamiNewEpisodeShape, 0)

	for _, DOMEp := range LastDOMEpList {
		// Parents
		ImgParent := DOMEp.Timeout(2 * time.Second).MustElement(".img")
		TopParent := DOMEp.Timeout(2 * time.Second).MustElement(".top")
		InfoParent := DOMEp.Timeout(2 * time.Second).MustElement(".info")

		// Data
		Title := TopParent.Timeout(2 * time.Second).MustElement("a").Timeout(2 * time.Second).MustElement(".title").Timeout(2 * time.Second).MustText()
		EpisodeId := TopParent.Timeout(2 * time.Second).MustElement(".episode").Timeout(2 * time.Second).MustText()
		TimeReleased := InfoParent.Timeout(2 * time.Second).MustElement(".date").Timeout(2 * time.Second).MustText()
		ImgP := ImgParent.Timeout(2 * time.Second).MustElement("img").Timeout(2 * time.Second).MustAttribute("data-original")
		Team := TopParent.Timeout(2 * time.Second).MustElement(".team").Timeout(2 * time.Second).MustText()

		var Img string
		if ImgP != nil {
			Img = *ImgP
		}

		NewEp := AdkamiNewEpisodeShape{Title: Title, EpisodeId: EpisodeId, TimeReleased: TimeReleased, Img: Img, Team: Team}
		AdkamiNewEpisodes = append(AdkamiNewEpisodes, NewEp)
	}

	return AdkamiNewEpisodes
}
