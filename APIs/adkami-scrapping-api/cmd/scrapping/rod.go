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
	return rod.New().Timeout(time.Minute).ControlURL(l.MustLaunch()).MustConnect().MustIncognito().NoDefaultDevice(), nil
}

type AdkamiNewEpisodeShape struct {
	Title        string // Black Clover
	EpisodeId    string // Episode 28 vostfr
	TimeReleased string // 28min ago
	Img          string // Img of anime
	Team         string // Wakanim
}

func IsScrapApiError(page *rod.Page) bool {
	pre, err := page.Timeout(time.Second).Element("pre")
	if err == nil {
		log.Println(pre.MustText())
		return true
	}

	return false
}

func FetchAdkamiLatestEps() ([]AdkamiNewEpisodeShape, error) {
	log.Println("Fecthing New Eps...")
	browser, err := newBrowser()
	if err != nil {
		log.Println(err)
		return nil, errors.New("cannot open browser")
	}
	defer browser.MustClose()

	SearchPage := stealth.MustPage(browser)

	ADKamiURL := "https://www.adkami.com/"
	ScrappingURL := fmt.Sprintf("https://api.scraperbox.com/scrape?token=%s&proxy_location=fr&residential_proxy=true&url=%s", os.Getenv("WEBSCAPPING_APIKEY"), url.QueryEscape(ADKamiURL))

	SearchPage.MustNavigate(ScrappingURL)
	SearchPage.MustWaitLoad()

	if IsScrapApiError(SearchPage) {
		return nil, errors.New("error when requesting scrapping api")
	}

	LastDOMEpList := SearchPage.MustElements(`.video-item-list`) // search input
	AdkamiNewEpisodes := make([]AdkamiNewEpisodeShape, 0)
	if len(LastDOMEpList) <= 0 {
		return nil, errors.New("cannot query the items")
	}

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

	return AdkamiNewEpisodes, nil
}
