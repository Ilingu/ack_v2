package updates

import (
	"adkami-scrapping-api/cmd/scrapping"
	"adkami-scrapping-api/cmd/utils"
)

func IsSameEpisode(EpA, EpB scrapping.AdkamiNewEpisodeShape) bool {
	return utils.Hash(EpA.Title+EpA.EpisodeId) == utils.Hash(EpB.Title+EpB.EpisodeId)
}
