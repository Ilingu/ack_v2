package scrapping

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/stealth"
)

const PAGE_TIMEOUT = 10 * time.Second

type ScrappingConfig struct {
	TitlesItarable []string
	Season         string
	Year           string
	Type           string
}

func NewBrowser() (*rod.Browser, error) {
	if os.Getenv("APP_MODE") != "prod" {
		return rod.New().Timeout(3 * time.Minute).MustConnect().MustIncognito().NoDefaultDevice(), nil // In dev
	}

	// In prod
	path, ok := launcher.LookPath() // looking for the chromium execuatble path
	if !ok {
		return nil, errors.New("cannot find the chromium executable")
	}

	l := launcher.New().Bin(path)
	l.Headless(true).Set("disable-gpu").Set("disable-dev-shm-usage").Set("disable-setuid-sandbox").Set("no-sandbox")
	return rod.New().Timeout(3 * time.Minute).ControlURL(l.MustLaunch()).MustConnect().MustIncognito().NoDefaultDevice(), nil
}

func CheckAndCloseCookies(page *rod.Page, inputSearch *rod.Element) {
	_, hided := page.Timeout(time.Second).Element(".fc-consent-root")
	if hided == nil {
		page.Timeout(2 * time.Second).MustElement(".fc-consent-root .fc-footer-buttons .fc-cta-consent").MustClick() // Cookie popup is opened --> closed it
	} else {
		return // if popup not opened: pass
	}

	_, hided = page.Timeout(time.Second).Element(".fc-consent-root") // check if popup was closed successfully
	if hided == nil {
		log.Println("Couldn't close cookie popup")
		return
	}
	inputSearch.Focus() // Refocus input, to then submit
	time.Sleep(time.Second / 4)
}

func (sc ScrappingConfig) Fetch9AnimeLink() (string, error) {
	browser, err := NewBrowser()
	if err != nil {
		return "", err
	}
	defer browser.MustClose()

	SearchPage := stealth.MustPage(browser)

	for _, title := range sc.TitlesItarable {
		SearchPage.MustNavigate("https://9anime.id/filter") // go to filter page
		SearchPage.MustWaitLoad()

		inputSearch := SearchPage.Timeout(PAGE_TIMEOUT).MustElement(`form.filters [name="keyword"]`) // search input

		/* Typing Title */
		for _, char := range title {
			inputSearch.MustInput(string(char))                       // type randomly title character by character (to simulate human behavior)
			time.Sleep(time.Second / time.Duration(rand.Intn(30)+20)) // type interval: between 50ms and 20ms
		}

		CheckAndCloseCookies(SearchPage, inputSearch)
		inputSearch.MustKeyActions().Type(input.Enter).MustDo() // Submit by pressing enter on form (because clicking on submitBtn triggered the anti-bot detection)
		SearchPage.MustWaitLoad()                               // wait for response

		correctUrl := fmt.Sprintf("?keyword=%s", url.QueryEscape(title)) // encodeURI() in go: https://www.urlencoder.io/golang/
		if !strings.Contains(SearchPage.MustInfo().URL, correctUrl) {
			log.Printf("[WARN]: wrong redirection url, expected containing: %s, got: %s\n", correctUrl, SearchPage.MustInfo().URL)
			continue // form must have been submitted, so URL must have changed
		}

		/* Searching with season,year,type */
		Token, ok := GetToken(SearchPage.MustInfo().URL) // With the token, we can freely change the url to search more deeply
		if !ok {
			log.Println("[WARN]: Invalid token")
			continue
		}

		time.Sleep(time.Second / 2)
		SearchURL := sc.GenerateSearchUrl(title, Token) // Get template search url
		SearchPage.MustNavigate(SearchURL)              // go to search url

		/* Get result and check it */
		result, err := SearchPage.Timeout(PAGE_TIMEOUT / 5).Element("#list-items") // posters list
		if err != nil || len(result.MustElements(".item")) <= 0 {
			log.Println("[WARN]: No Anime Children")
			continue // No animes found --> next title
		}

		AnimePoster, errNotFound := SearchPage.Timeout(PAGE_TIMEOUT / 5).Element(`#list-items :first-child .ani.poster > a`) // search anime elem
		if errNotFound != nil {
			log.Println("[WARN]: cannot find anime url element (href attr)")
			continue // No animes found --> next title
		}

		NineAnimeURL := *AnimePoster.MustAttribute("href") // get anime url
		if len(strings.TrimSpace(NineAnimeURL)) <= 0 || !strings.HasPrefix(NineAnimeURL, "/watch/") {
			log.Printf("[WARN]: got an invalid url: %s\n", NineAnimeURL)
			continue // invalid url --> next title
		}

		return NineAnimeURL, nil
	}

	return "", errors.New("cannot find anime url in these requests")
}
