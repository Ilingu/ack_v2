import { DocumentSnapshot } from "@firebase/firestore";
import {
  AnimeShape,
  EpisodesShape,
  JikanApiResAnime,
  JikanApiResAnimeEpisodes,
  JikanApiResAnimeRecommandations,
  JikanApiResEpisodes,
  JikanApiResRecommandations,
  JikanApiResSeasonAnime,
  RecommendationsShape,
  SeasonAnimesShape,
} from "./types/interface";
import { AnimeStatusType, TheFourSeason } from "./types/types";

/**
 * Is the string a valid url (https://www.example.com)
 * @param {URL} url
 * @returns true | false
 */
export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Get Data with SWR
 * @param {URL} url
 */
export async function callApi(url: string) {
  if (!isValidUrl(url)) return;
  const req = await fetch(url);
  return await req.json();
}

/**
 * Converts a firestore doc to JSON
 * @param {DocumentSnapshot} doc
 */
export function postToJSON(doc: DocumentSnapshot) {
  const data = doc.data();
  return {
    ...data,
  };
}

/**
 * Remove already existing obj in array
 * @param {any[]} ary
 */
export function removeDuplicates<T>(ary: T[]) {
  return [...Array.from(new Set(ary))];
}

/**
 * Transform JikanApi obj to EpisodeShape obj
 * @param {JikanApiResAnimeEpisodes[]} JikanObj
 */
export function JikanApiToEpisodesShape(
  JikanObj: JikanApiResAnimeEpisodes[]
): EpisodesShape[] {
  return JikanObj.map((epData) => ({
    epsId: epData.episode_id,
    title: epData.title,
    Filler: epData.filler,
    Recap: epData.recap,
    EpsURL: epData.video_url,
    ForumURL: epData.forum_url,
  }));
}

/**
 * Transform JikanApi obj to JikanApiToRecommendationShape obj
 * @param {JikanApiResAnimeEpisodes[]} JikanObj
 */
export function JikanApiToRecommendationShape(
  JikanObj: JikanApiResAnimeRecommandations[]
): RecommendationsShape[] {
  return JikanObj.map((recomData) => ({
    malId: recomData.mal_id,
    photoUrl: recomData.image_url,
    recommendationCount: recomData.recommendation_count,
    title: recomData.title,
  }));
}

/**
 * Transform JikanApi obj to JikanApiToRecommendationShape obj
 * @param {JikanApiResAnimeEpisodes[]} JikanObj
 */
export function JikanApiToSeasonAnimeShape(
  JikanObj: JikanApiResSeasonAnime[]
): SeasonAnimesShape[] {
  return JikanObj.map((SeasonData) => ({
    title: SeasonData.title,
    type: SeasonData.type,
    PhotoUrl: SeasonData.image_url,
    BeginAiring: new Date(SeasonData.airing_start).toLocaleDateString(),
    score: SeasonData.score,
    r18: SeasonData.r18,
    MalId: SeasonData.mal_id,
  })).filter((Sd) => !Sd.r18);
}

/**
 * Transform JikanApi obj to AnimeShape obj
 * @param {any[]} ary
 */
export function JikanApiToAnimeShape(
  JikanObj: [
    JikanApiResAnime,
    JikanApiResAnimeEpisodes[],
    JikanApiResRecommandations
  ]
): AnimeShape {
  return {
    title: JikanObj[0].title,
    Genre: JikanObj[0].genres,
    AgeRating: JikanObj[0].rating,
    Airing: JikanObj[0].airing,
    AlternativeTitle: {
      title_english: JikanObj[0].title_english,
      title_japanese: JikanObj[0].title_japanese,
      title_synonyms: JikanObj[0].title_synonyms,
    },
    OverallScore: JikanObj[0].score,
    ScoredBy: JikanObj[0].scored_by,
    Status: JikanObj[0].status as AnimeStatusType,
    type: JikanObj[0].type,
    ReleaseDate: JikanObj[0].premiered,
    Synopsis: JikanObj[0].synopsis,
    Studios: JikanObj[0].studios,
    Theme: JikanObj[0].themes,
    photoPath: removeParamsFromPhotoUrl(JikanObj[0].image_url),
    malId: JikanObj[0].mal_id,
    trailer_url: JikanObj[0].trailer_url,
    nbEp: JikanObj[0].episodes,
    MalPage: JikanObj[0].url,
    duration:
      JikanObj[0].type === "Movie"
        ? JikanObj[0].duration
        : JikanObj[0].duration,
    Recommendations:
      JikanObj[2]?.recommendations.slice(0, 7).map((recom) => ({
        ...recom,
        image_url: removeParamsFromPhotoUrl(recom.image_url),
      })) || [],
    EpisodesData: JikanObj[0].type === "TV" && JikanObj[1],
    LastRefresh: Date.now(),
  };
}

/**
 * Remove ?s= from photoURL
 * @param {string} photoURL
 */
export const removeParamsFromPhotoUrl = (photoUrl: string) =>
  photoUrl.split("?s=")[0];

/**
 * Fetch All Ep Of An Anime
 * @param {string} animeId
 */
export function getAllTheEpisodes(
  id: string
): Promise<JikanApiResAnimeEpisodes[]> {
  return new Promise(async (resolve, reject) => {
    let Episodes: JikanApiResAnimeEpisodes[] = [];
    let i = 1;

    const fetchOtherEP = async () => {
      try {
        const eps: JikanApiResEpisodes = await callApi(
          `https://api.jikan.moe/v3/anime/${id}/episodes/${i}`
        );
        if (
          !eps?.episodes ||
          eps?.episodes?.length <= 0 ||
          eps?.status === 404 ||
          i >= 5
        )
          return resolve(Episodes);
        Episodes = [...Episodes, ...eps.episodes];
        if (i === eps?.episodes_last_page) return resolve(Episodes);
        i++;
        setTimeout(fetchOtherEP, 500);
      } catch (err) {
        reject(err);
      }
    };
    fetchOtherEP();
  });
}

/**
 * @returns 404's Page
 */
export const Return404 = (): {
  notFound: true;
} => ({
  notFound: true,
});

/**
 * @returns The current season: "winter" | "spring" | "summer" | "fall"
 */
export const WhitchSeason = () => {
  const Month = new Date().getMonth() + 1;
  const Day = new Date().getDate();
  let season: TheFourSeason;
  switch (true) {
    case Month === 12 && Day >= 21:
    case Month === 1:
    case Month === 2:
    case Month === 3 && Day < 20:
      season = "winter";
      break;
    case Month === 3 && Day >= 20:
    case Month === 4:
    case Month === 5:
    case Month === 6 && Day < 20:
      season = "spring";
      break;
    case Month === 6 && Day >= 20:
    case Month === 7:
    case Month === 8:
    case Month === 9 && Day < 22:
      season = "summer";
      break;
    case Month === 9 && Day >= 22:
    case Month === 10:
    case Month === 11:
    case Month === 12 && Day < 21:
      season = "fall";
      break;
    default:
      break;
  }
  return season;
};

/**
 * Randomly Suffle the Array in params
 * @param {Array} ArrayToShuffle
 * @returns The randomly shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] =>
  array.sort(() => Math.random() - 0.5);
