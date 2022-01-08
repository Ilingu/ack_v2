import { DocumentSnapshot } from "@firebase/firestore";
import {
  AnimeShape,
  EpisodesShape,
  JikanApiERROR,
  JikanApiResAnime,
  JikanApiResEpisodes,
  JikanApiResEpisodesRoot,
  JikanApiResRecommandations,
  JikanApiResSeason,
  RecommendationsShape,
  SeasonAnimesShape,
} from "./types/interface";
import { AnimeStatusType, TheFourSeason } from "./types/types";
import { doc, updateDoc } from "@firebase/firestore";
import { auth, db } from "./firebase";
import toast from "react-hot-toast";

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
 * Fetch Data From Api
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
  JikanObj: JikanApiResEpisodes[]
): EpisodesShape[] {
  return JikanObj.map((epData, i) => ({
    epsId: epData.mal_id || i + 1,
    title: epData.title,
    Filler: epData.filler,
    Recap: epData.recap,
    EpsURL: epData.url,
    ForumURL: epData.forum_url,
  }));
}

/**
 * Transform JikanApi obj to JikanApiToRecommendationShape obj
 * @param {JikanApiResAnimeEpisodes[]} JikanObj
 */
export function JikanApiToRecommendationShape(
  JikanObj: JikanApiResRecommandations[]
): RecommendationsShape[] {
  return JikanObj.map((recomData) => ({
    malId: recomData.entry.mal_id,
    photoUrl: recomData.entry.images.jpg.image_url,
    recommendationCount: recomData.votes,
    title: recomData.entry.title,
  }));
}

/**
 * Transform JikanApi obj to JikanApiToRecommendationShape obj
 * @param {JikanApiResAnimeEpisodes[]} JikanObj
 */
export function JikanApiToSeasonAnimeShape(
  JikanObj: JikanApiResSeason[]
): SeasonAnimesShape[] {
  return JikanObj.map((SeasonData) => ({
    title: SeasonData.title,
    type: SeasonData.type,
    PhotoUrl: SeasonData.images.jpg.image_url,
    BeginAiring: new Date(SeasonData.aired.from).toLocaleDateString(),
    score: SeasonData.score,
    MalId: SeasonData.mal_id,
  }));
}

/**
 * Transform JikanApi obj to AnimeShape obj
 * @param {any[]} ary
 */
export function JikanApiToAnimeShape(
  JikanObj: [
    JikanApiResAnime,
    JikanApiResEpisodes[],
    JikanApiResRecommandations[]
  ]
): AnimeShape {
  return {
    title: JikanObj[0].title,
    Genre: JikanObj[0].genres,
    AgeRating: JikanObj[0].rating,
    Airing: JikanObj[0].airing,
    AiringDate: new Date(JikanObj[0].aired.from).toLocaleDateString(),
    AlternativeTitle: {
      title_english: JikanObj[0].title_english,
      title_japanese: JikanObj[0].title_japanese,
      title_synonyms: JikanObj[0].title_synonyms,
    },
    OverallScore: JikanObj[0].score,
    ScoredBy: JikanObj[0].scored_by,
    Status: JikanObj[0].status as AnimeStatusType,
    type: JikanObj[0].type,
    ReleaseDate: `${JikanObj[0].season} ${JikanObj[0].year}`,
    Synopsis: JikanObj[0].synopsis,
    Studios: JikanObj[0].studios,
    Theme: JikanObj[0].themes,
    photoPath: removeParamsFromPhotoUrl(JikanObj[0].images.jpg.image_url),
    malId: JikanObj[0].mal_id,
    trailer_url: JikanObj[0].trailer.embed_url,
    nbEp: JikanObj[0].episodes || 12,
    MalPage: JikanObj[0].url,
    duration:
      JikanObj[0].type === "Movie"
        ? JikanObj[0].duration
        : JikanObj[0].duration,
    Recommendations:
      JikanObj[2]?.slice(0, 7).map((recom) => ({
        ...recom,
        image_url: removeParamsFromPhotoUrl(recom.entry.images.jpg.image_url),
      })) || [],
    EpisodesData: JikanObj[0].type === "TV" && JikanObj[1],
    LastRefresh: Date.now(),
    broadcast: JikanObj[0].broadcast.string,
  };
}

/**
 * Remove ?s= from photoURL
 * @param {string} photoURL
 */
export const removeParamsFromPhotoUrl = (photoUrl: string) =>
  photoUrl.split("?s=")[0];

/**
 * Is the Api Req an error ?
 * @param {JikanApiERROR} api_response
 * @returns {boolean} true | false
 */
export const IsError = (api_response: JikanApiERROR): boolean => {
  if (!!api_response?.error) return true;
  return false;
};

/**
 * Fetch All Ep Of An Anime
 * @param {string} animeId
 * @returns {Promise<JikanApiResEpisodes[]>} Promise Array with all anime eps
 */
export function getAllTheEpisodes(id: string): Promise<JikanApiResEpisodes[]> {
  return new Promise(async (resolve, reject) => {
    let Episodes: JikanApiResEpisodes[] = [];
    let i = 1;

    const fetchOtherEP = async () => {
      try {
        let eps: JikanApiResEpisodesRoot = await callApi(
          `https://api.jikan.moe/v4/anime/${id}/episodes?page=${i}`
        );
        if (
          IsError(eps as unknown as JikanApiERROR) ||
          !eps?.data ||
          eps?.data?.length <= 0 ||
          i >= 5
        )
          return resolve(Episodes);
        Episodes = [...Episodes, ...eps.data];
        if (!eps?.pagination.has_next_page) return resolve(Episodes);
        i++;
        setTimeout(fetchOtherEP, 4050);
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

/**
 * Copy Text To User Clipbord
 * @param {string} text
 */
export const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text);

/**
 * Toggle User Anime Fav Field
 * @param {string} AnimeId
 * @param {boolean} currentVal
 */
export const ToggleFav = (AnimeId: string, currentVal: boolean) => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      AnimeId
    );

    updateDoc(AnimeRef, {
      Fav: !currentVal,
    });

    !currentVal && toast.success("Successfully added to your favorite");
    currentVal && toast.success("Successfully removed from your favorite");
  } catch (err) {
    toast.error("Cannot add this anime to your favorite");
  }
};
