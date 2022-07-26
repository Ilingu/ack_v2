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
		return rod.New().Timeout(3 * time.Minute).MustConnect().MustIncognito().NoDefaultDevice(), nil // In dev
	}

	// In prod
	path, ok := launcher.LookPath() // looking for the chromium executable path
	log.Println(ok, path)
	if !ok {
		return nil, errors.New("cannot find the chromium executable")
	}

	l := launcher.New().Bin(path)
	l.Headless(true).Set("disable-gpu").Set("disable-dev-shm-usage").Set("disable-setuid-sandbox").Set("no-sandbox")
	return rod.New().Timeout(3 * time.Minute).ControlURL(l.MustLaunch()).MustConnect().MustIncognito().NoDefaultDevice(), nil
}

type AdkamiNewEpisodeShape struct {
	Title        string // Black Clover
	EpisodeId    string // Episode 28 vostfr
	TimeReleased string // 28min ago
	Img          string // Img of anime
	Team         string // Wakanim
}

func FetchAdkamiLatestEps() []AdkamiNewEpisodeShape {
	log.Println("Finding New Eps...")
	browser, err := newBrowser()
	if err != nil {
		log.Println(err)
		return nil
	}
	defer browser.MustClose()

	SearchPage := stealth.MustPage(browser)
	SearchPage.MustNavigate("https://www.adkami.com/").MustWaitLoad()

	LastDOMEpList := SearchPage.MustElements(`#indexpage .video-item-list.up`) // search input

	AdkamiNewEpisodes := make([]AdkamiNewEpisodeShape, 0)
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

	return AdkamiNewEpisodes
}