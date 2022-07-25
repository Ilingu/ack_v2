package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
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

/* UTILS HELPERS */
func isEmptyString(str string) bool {
	return len(strings.TrimSpace(str)) <= 0
}

type LinkArgs struct {
	TitlesItarable []string
	Season         string
	Year           string
	Type           string
}

func parseQuery(query url.Values) (LinkArgs, error) {
	TitlesItarableStr, Season, Year, Type := query.Get("TitlesItarable"), query.Get("season"), query.Get("year"), query.Get("type")
	if isEmptyString(TitlesItarableStr) || isEmptyString(Season) || isEmptyString(Year) || isEmptyString(Type) {
		return LinkArgs{}, errors.New("invalid arguments in query")
	}

	TitlesItarable := strings.Split(TitlesItarableStr, ",")
	if len(TitlesItarable) <= 0 {
		return LinkArgs{}, errors.New("invalid titles in query")
	}

	return LinkArgs{TitlesItarable: TitlesItarable, Season: Season, Year: Year, Type: Type}, nil
}

// func (args LinkArgs) ToURLs() []string {
// 	UrlsQuery := make([]string, 0)
// 	for _, title := range args.TitlesItarable {
// 		queryTitle := strings.ReplaceAll(strings.ToLower(title), " ", "+")
// 		NineAnimeQuery := fmt.Sprintf(`https://9anime.id/filter?keyword=%s&season[]=%s&year[]=%s&type[]=%s&language[]=sub&sort=recently_updated`, queryTitle, args.Season, args.Year, strings.ToLower(args.Type))

// 		// encodeURI() in golang --> https://www.urlencoder.io/golang/
// 		if os.Getenv("APP_MODE") == "prod" {
// 			ScrappingWrapper := fmt.Sprintf("https://api.webscrapingapi.com/v1?api_key=%s&url=%s&device=desktop&proxy_type=datacenter", os.Getenv("WEB_SCAPPING_API_KEY"), url.QueryEscape(NineAnimeQuery))
// 			UrlsQuery = append(UrlsQuery, ScrappingWrapper)
// 		} else {
// 			UrlsQuery = append(UrlsQuery, NineAnimeQuery)
// 		}
// 	}

// 	return UrlsQuery
// }
