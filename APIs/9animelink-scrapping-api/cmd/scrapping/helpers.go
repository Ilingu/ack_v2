package scrapping

import (
	"fmt"
	"net/url"
	"strings"
)

func GetToken(URL string) (string, bool) {
	baseUrl, err := url.Parse(URL)
	if err != nil {
		return "", false
	}

	t := baseUrl.Query().Get("vrf")
	if len(strings.TrimSpace(t)) <= 0 {
		return "", false
	}
	return t, true
}

func (sc ScrappingConfig) GenerateSearchUrl(CurrTitle, Token string) string {
	baseUrl, _ := url.Parse("https://9anime.id")
	baseUrl.Path = "filter"

	params := url.Values{}
	params.Add("keyword", CurrTitle)
	params.Add("season[]", sc.Season)
	params.Add("year[]", sc.Year)
	params.Add("type[]", strings.ToLower(sc.Type))
	params.Add("language[]", "sub")
	baseUrl.RawQuery = params.Encode()

	return fmt.Sprintf("%s&vrf=%s", baseUrl.String(), Token)
}
