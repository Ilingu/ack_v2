package updates

import (
	"adkami-scrapping-api/cmd/caching"
	"adkami-scrapping-api/cmd/scrapping"
	"adkami-scrapping-api/cmd/utils"
)

func QueryUpdate() []scrapping.AdkamiNewEpisodeShape {
	LatestEps, err := scrapping.FetchAdkamiLatestEps()
	if err != nil {
		return nil
	}

	defer func() {
		go caching.CacheNewEpsDatas(LatestEps) // Cache LatestEps for Next Updates
	}()

	prevLatestEps, ok := caching.ReadCachingFile()
	if !ok {
		return nil // if no prev, no updates
	}

	// Filter NewEp
	NewEps := []scrapping.AdkamiNewEpisodeShape{}
	for _, latestEp := range LatestEps {
		var found bool
		for _, prevEp := range prevLatestEps {
			if IsSameEpisode(prevEp, latestEp) {
				found = true
				break
			}
		}

		if !found {
			NewEps = append(NewEps, latestEp)
		}
	}

	return utils.ReverseSlice(NewEps)
}
