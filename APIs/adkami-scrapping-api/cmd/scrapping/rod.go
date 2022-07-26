package scrapping

import (
	"errors"
	"log"
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

	l := launcher.NewUserMode().Bin(path).Headless(true).Set("incognito").Set("no-sandbox").Set("no-zygote")
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
	browser, err := newBrowser()
	if err != nil {
		log.Println(err)
		return nil
	}
	defer browser.MustClose()
	log.Println("1. Fecthing New Eps...")

	SearchPage := stealth.MustPage(browser)

	// ADKamiURL := "https://www.adkami.com/"
	// ScrappingURL := fmt.Sprintf("https://api.webscrapingapi.com/v1?api_key=%s&url=%s&device=desktop&proxy_type=datacenter", os.Getenv("WEBSCAPPING_APIKEY"), url.QueryEscape(ADKamiURL))
	SearchPage.MustNavigate("https://www.adkami.com/")
	SearchPage.MustWaitLoad()
	log.Println("2. On ADKami...")

	LastDOMEpList := SearchPage.MustElements(`#indexpage .video-item-list.up`) // search input
	AdkamiNewEpisodes := make([]AdkamiNewEpisodeShape, 0)
	log.Println("3. DOM Elems Fetched...")

	for _, DOMEp := range LastDOMEpList {
		// Parents
		ImgParent := DOMEp.MustElement(".img")
		TopParent := DOMEp.MustElement(".top")
		InfoParent := DOMEp.MustElement(".info")

		// Data
		Title := TopParent.MustElement("a").MustElement(".title").MustText()
		EpisodeId := TopParent.MustElement(".episode").MustText()
		TimeReleased := InfoParent.MustElement(".date").MustText()
		ImgP := ImgParent.MustElement("img").MustAttribute("data-original")
		Team := TopParent.MustElement(".team").MustText()

		var Img string
		if ImgP != nil {
			Img = *ImgP
		}

		NewEp := AdkamiNewEpisodeShape{Title: Title, EpisodeId: EpisodeId, TimeReleased: TimeReleased, Img: Img, Team: Team}
		AdkamiNewEpisodes = append(AdkamiNewEpisodes, NewEp)
	}

	log.Println("4. Done!", len(AdkamiNewEpisodes))
	return AdkamiNewEpisodes
}
