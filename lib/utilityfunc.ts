// Types
import {
  AnimeConfigPathsIdShape,
  AnimeShape,
  EpisodesShape,
  InternalApiResError,
  JikanApiERROR,
  JikanApiResAnime,
  JikanApiResAnimeRoot,
  JikanApiResEpisodes,
  JikanApiResEpisodesRoot,
  JikanApiResRecommandations,
  JikanApiResRecommandationsRoot,
  JikanApiResSeason,
  RecommendationsShape,
  SeasonAnimesShape,
} from "./types/interface";
import {
  AnimeStatusType,
  DateOfWeek,
  DayOfWeek,
  TheFourSeason,
} from "./types/types";
// DB
import {
  doc,
  updateDoc,
  writeBatch,
  DocumentSnapshot,
  getDoc,
} from "@firebase/firestore";
import { auth, db } from "./firebase";
// Toast
import toast from "react-hot-toast";

/* FUNC */

/**
 * Fetch Anime Data and add it to FB
 * @param {string} animeId
 */
export const GetAnimeData = async (
  animeId: string
): Promise<AnimeShape | InternalApiResError> => {
  let animeData: AnimeShape;
  try {
    const endpoint = `https://api.jikan.moe/v4/anime/${animeId}`;
    // Req
    const { data: animeRes }: JikanApiResAnimeRoot = await callApi(endpoint);
    let animeEpsRes = await getAllTheEpisodes(animeId);
    const { data: animeRecommendationsRes }: JikanApiResRecommandationsRoot =
      await callApi(endpoint + "/recommendations");

    if (
      IsError(animeRes as unknown as JikanApiERROR) ||
      IsError(animeRecommendationsRes as unknown as JikanApiERROR)
    ) {
      return { message: `Error when fetching: ${animeId}.`, err: true };
    }

    if (animeEpsRes.length <= 0) {
      for (let i = 0; i < 12; i++) {
        animeEpsRes = [
          ...animeEpsRes,
          {
            mal_id: i + 1,
          },
        ];
      }
    }

    const AllAnimeData = await Promise.all([
      animeRes,
      animeEpsRes,
      animeRecommendationsRes,
    ]);

    let IsGood = true;
    AllAnimeData || (IsGood = false);
    AllAnimeData.forEach((oneData) => {
      if (!oneData) IsGood = false;
    });

    if (IsGood) {
      animeData = JikanApiToAnimeShape(AllAnimeData);
      AddNewGlobalAnime(animeId, animeData);

      return animeData;
    }
    return { message: `Anime with id: ${animeId} not found.`, err: true };
  } catch (err) {
    console.error(err);
    return { message: `Anime with id: ${animeId} not found.`, err: true };
  }
};
export const AddNewGlobalAnime = async (
  animeId: string,
  animeData: AnimeShape
) => {
  try {
    const batch = writeBatch(db);

    const newAnimesRef = doc(db, "animes", animeId);
    batch.set(newAnimesRef, animeData);

    const animesConfigPathsRef = doc(db, "animes", "animes-config");
    const animesConfigPaths = (
      await getDoc(animesConfigPathsRef)
    ).data() as AnimeConfigPathsIdShape;

    const ArrayPathsToObjPaths = animesConfigPaths?.AllAnimeId.reduce(
      (a, id) => ({ ...a, [id]: id }),
      {}
    );
    if (!ArrayPathsToObjPaths[animeId]) {
      const newAnimeConfigPaths = {
        AllAnimeId: [...animesConfigPaths?.AllAnimeId, animeId],
      };
      batch.update(animesConfigPathsRef, newAnimeConfigPaths);
    }

    await batch.commit();
  } catch (err) {
    console.error(err);
  }
};

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
    broadcast:
      JikanObj[0].broadcast.string && JikanObj[0].broadcast.string !== "Unknown"
        ? JikanObj[0].broadcast.string
        : null,
    LastRefresh:
      (JikanObj[0].status as AnimeStatusType) === "Not yet aired"
        ? Date.now() + 86400000
        : Date.now() + 2592000000,
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
export const Return404 = (
  revalidate = 0
): {
  notFound: true;
  revalidate?: number;
} => ({
  notFound: true,
  revalidate: revalidate !== 0 ? revalidate : undefined,
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
 * @returns The current Date From Day: 0 | 1 | 2 | 3 | 4 | 5 | 6
 */
export const WhitchDate = (day: DayOfWeek): DateOfWeek => {
  if (day === "sundays") return 0;
  if (day === "mondays") return 1;
  if (day === "tuesdays") return 2;
  if (day === "wednesdays") return 3;
  if (day === "thursdays") return 4;
  if (day === "fridays") return 5;
  if (day === "saturdays") return 6;
  return 0;
};
/**
 * @returns The current Date From Day: 0 | 1 | 2 | 3 | 4 | 5 | 6
 */
export const WhitchDay = (date: DateOfWeek): DayOfWeek => {
  if (date === 0) return "sundays";
  if (date === 1) return "mondays";
  if (date === 2) return "tuesdays";
  if (date === 3) return "wednesdays";
  if (date === 4) return "thursdays";
  if (date === 5) return "fridays";
  if (date === 6) return "saturdays";
  return "sundays";
};

/**
 * @param {string} JST_Broadcast
 * @returns The Converted To UTC+1 Timezone Broadcast
 */
export const ConvertBroadcastTimeZone = (
  broadcast: string,
  ReturnType:
    | "NextBroadcastNumber"
    | "NextBroadcastString"
    | "BroadcastFormated"
): number | string => {
  try {
    // Convert String Time to JST Date
    const [NextDay, _, NextTime] = broadcast.toLowerCase().split(" ");
    const NextBroadcastJST = new Date();
    NextBroadcastJST.setDate(
      NextBroadcastJST.getDate() +
        ((WhitchDate(NextDay as DayOfWeek) + 7 - NextBroadcastJST.getDay()) %
          7 || 7)
    );
    const [NextHour, NextMinute] = NextTime.split(":").map((time) =>
      parseInt(time)
    );
    NextBroadcastJST.setHours(NextHour, NextMinute, 0, 0);

    // Convert to UTC
    const JSTtoUTC1Offset = 8;
    const NextBroadcastJTCTime = NextBroadcastJST.getTime();
    const localOffset = NextBroadcastJST.getTimezoneOffset() * 60000;

    const UTCOffset = NextBroadcastJTCTime + localOffset;
    const UTC1Time = UTCOffset - 3600000 * JSTtoUTC1Offset;

    // Exctract Data From Broadcast UTC+1, but based on JST
    const BroadcastUTC1DateInstance = new Date(UTC1Time);
    const [BroadcastUTC1Hours, BroadcastUTC1Min] = [
      BroadcastUTC1DateInstance.getHours(),
      BroadcastUTC1DateInstance.getMinutes(),
    ];
    const BroadcastUTC1Date = BroadcastUTC1DateInstance.getDay();

    // Convert "UTC+1 based JST" to "UTC+1"
    const NextBroadcastUTC1 = new Date();
    NextBroadcastUTC1.setDate(
      NextBroadcastUTC1.getDate() +
        ((BroadcastUTC1Date + 7 - NextBroadcastUTC1.getDay()) % 7 || 7)
    );
    NextBroadcastUTC1.setHours(BroadcastUTC1Hours, BroadcastUTC1Min, 0, 0);

    const NextUTC1Time = NextBroadcastUTC1.getTime(); // NextEp in UTC timestamp
    const NextBroadcastUTC1Str = NextBroadcastUTC1.toLocaleString(); // NextEp in UTC Date

    if (ReturnType === "NextBroadcastNumber") return NextUTC1Time;
    if (ReturnType === "NextBroadcastString") return NextBroadcastUTC1Str;

    const SplitedUTC1Date = NextBroadcastUTC1Str.split(",");
    const ToDay = WhitchDay(
      new Date(SplitedUTC1Date[0]).getDay() as DateOfWeek
    );
    return `${ToDay} ${SplitedUTC1Date[1].trim().replace(":00", "")}`;
  } catch (err) {
    return "None";
  }
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
