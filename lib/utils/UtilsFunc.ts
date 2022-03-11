import crypto from "crypto";
// Types
import {
  AdkamiLastReleasedEpisodeShape,
  ADKamiScrapperApiERROR,
  AlgoliaDatasShape,
  AnimeShape,
  EpisodesShape,
  JikanApiERROR,
  JikanApiResAnime,
  JikanApiResEpisodes,
  JikanApiResRecommandations,
  JikanApiResSeason,
  NetworkInformationShape,
  PosterSearchData,
  RecommendationsShape,
  SeasonAnimesShape,
  UserAnimeShape,
} from "./types/interface";
import {
  AnimeStatusType,
  DateOfWeek,
  DayOfWeek,
  TheFourSeason,
} from "./types/types";
// DB
import { doc, updateDoc, DocumentSnapshot } from "@firebase/firestore";
import { auth, db } from "../firebase/firebase";
// Toast
import toast from "react-hot-toast";
import { AnimeWatchType } from "./types/enums";
import { getDoc } from "firebase/firestore";

/* FUNC */

export const encryptDatas = (cookie: Buffer) => {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(process.env.NEXT_PUBLIC_COOKIES_ENCRYPT_KEY),
      iv
    );
    const encryptedCookie = Buffer.concat([
      Buffer.from("v10"),
      iv,
      cipher.update(cookie),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
    return encryptedCookie;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const decryptDatas = (encryptedCookie: Buffer): string => {
  try {
    const iv = encryptedCookie.slice(3, 3 + 12);
    const ciphertext = encryptedCookie.slice(
      3 + 12,
      encryptedCookie.length - 16
    );
    const authTag = encryptedCookie.slice(encryptedCookie.length - 16);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(process.env.NEXT_PUBLIC_COOKIES_ENCRYPT_KEY),
      iv
    );
    decipher.setAuthTag(authTag);
    const decryptedCookie = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decryptedCookie.toString("utf8");
  } catch (err) {
    console.error(err);
    return null;
  }
};

/* UTILS */

interface callApiArgs {
  url: string;
  internalCall?: boolean;
  AccessToken?: string;
  RequestProofOfCall?: boolean;
  reqParams?: RequestInit;
}
/**
 * Fetch Data From Api
 * @param {URL} url
 * @returns the response
 */
export async function callApi({
  url,
  AccessToken,
  RequestProofOfCall,
  internalCall,
  reqParams,
}: callApiArgs) {
  if (!isValidUrl(url)) return;

  try {
    let req = null;

    if (!internalCall) req = await fetch(url);
    else {
      const Params = {
        ...reqParams,
        headers: {
          authorization: AccessToken
            ? AccessToken
            : (await auth?.currentUser?.getIdToken()) || undefined,

          proofofcall: RequestProofOfCall
            ? encryptDatas(Buffer.from(Date.now().toString())).toString(
                "base64"
              )
            : undefined,
        },
      };

      req = await fetch(url, {
        ...Params,
      });
    }

    return await req.json();
  } catch (err) {
    console.error(err);
    return false;
  }
}

/**
 * Fetch Data From Api
 * @param {number[]} AnimesIds
 */
export const GetAnimesDatasByIds = async (AnimesIds: number[]) => {
  if (AnimesIds.length <= 0) return null;
  console.log("FB Query");

  try {
    const QAnimesDocs = await Promise.all(
      AnimesIds.map(async (AnimeId) => {
        const QAnimeRef = doc(db, "animes", AnimeId.toString());
        return await getDoc(QAnimeRef);
      })
    );
    const AnimesDatas = QAnimesDocs.map(postToJSON) as AnimeShape[];
    return AnimesDatas;
  } catch (err) {
    return null;
  }
};

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
 * Converts UserAnime array into filteredOne (Exclude UNWATCHED && WONT_WATCH)
 * @param {UserAnimeShape[]} UserAnimes
 */
export const filterUserAnime = (UserAnimes: UserAnimeShape[]) =>
  UserAnimes?.filter(
    ({ WatchType }) =>
      WatchType !== AnimeWatchType.WONT_WATCH &&
      WatchType !== AnimeWatchType.UNWATCHED
  );

/**
 * Converts a firestore doc to JSON
 * @param {DocumentSnapshot} doc
 */
export function postToJSON(
  doc:
    | DocumentSnapshot
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
) {
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

export function SpotDifferenciesBetweenArrays<T>(
  BaseArray: any[],
  ArrayToCompare: any[],
  BaseArrayKeyToExport: string,
  CompareArrayKeyToExport: string
): T[] {
  const Base = BaseArray.map((obj) => obj[BaseArrayKeyToExport]);
  const Compare = ArrayToCompare.map((obj) => obj[CompareArrayKeyToExport]);
  const MissingDependencies = Base.filter(
    (Comparatif) => !Compare.includes(Comparatif)
  );
  return MissingDependencies;
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
 * Transform JikanApi/Algolia obj to PosterSearchData obj
 * @param {AlgoliaDatasShape[]} JikanObj
 */
export const AnimeShapeToPosterData = (
  AlgoliaJikanArr?: AlgoliaDatasShape[]
): PosterSearchData[] =>
  AlgoliaJikanArr.map((AlgoliaJikanObj) => ({
    title: AlgoliaJikanObj.title,
    OverallScore: AlgoliaJikanObj.OverallScore,
    photoPath: removeParamsFromPhotoUrl(AlgoliaJikanObj.photoPath),
    type: AlgoliaJikanObj.type,
    malId:
      AlgoliaJikanObj.objectID ||
      (AlgoliaJikanObj as unknown as AnimeShape).malId,
  }));

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

interface SpecialAnimeShape {
  AnimeData: AnimeShape;
  IsAddableToDB: boolean;
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
): SpecialAnimeShape {
  const [AnimeData, EpsData, Recommendations] = JikanObj;
  let NextRefresh = null;
  let IsAddableToDB = true;

  const NewSeasonAnime =
    !!AnimeData?.airing ||
    !AnimeData?.aired?.to ||
    (AnimeData?.status as AnimeStatusType) === "Not yet aired";

  if (NewSeasonAnime) NextRefresh = Date.now() + 345600000;
  if (
    !NewSeasonAnime &&
    AnimeData?.score < 6 &&
    AnimeData?.rank >= 1500 &&
    AnimeData?.members < 15000
  )
    IsAddableToDB = false;

  return {
    AnimeData: {
      title: AnimeData?.title,
      Genre: AnimeData?.genres,
      AgeRating: AnimeData?.rating,
      Airing: AnimeData?.airing,
      AiringDate: new Date(AnimeData?.aired?.from).toLocaleDateString(),
      AlternativeTitle: {
        title_english: AnimeData?.title_english,
        title_japanese: AnimeData?.title_japanese,
        title_synonyms: AnimeData?.title_synonyms,
      },
      OverallScore: AnimeData?.score,
      ScoredBy: AnimeData?.scored_by,
      Status: AnimeData?.status as AnimeStatusType,
      type: AnimeData?.type,
      ReleaseDate: `${AnimeData?.season} ${AnimeData?.year}`,
      Synopsis: AnimeData?.synopsis,
      Studios: AnimeData?.studios,
      Theme: AnimeData?.themes,
      photoPath: removeParamsFromPhotoUrl(AnimeData?.images?.jpg?.image_url),
      malId: AnimeData?.mal_id,
      trailer_url: AnimeData?.trailer?.embed_url,
      nbEp: AnimeData?.episodes || 12,
      MalPage: AnimeData?.url,
      duration: AnimeData?.duration,
      Recommendations:
        Recommendations?.slice(0, 7).map((recom) => ({
          ...recom,
          image_url: removeParamsFromPhotoUrl(
            recom?.entry?.images?.jpg?.image_url
          ),
        })) || [],
      EpisodesData:
        (AnimeData?.type === "TV" ||
          AnimeData?.type === "OVA" ||
          AnimeData?.type === "ONA") &&
        EpsData,
      broadcast:
        AnimeData?.broadcast?.string &&
        AnimeData?.broadcast?.string !== "Unknown"
          ? AnimeData.broadcast.string
          : null,
      NextRefresh,
    },
    IsAddableToDB,
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
    const UTC1DayDate = SplitedUTC1Date[0].split("/").reverse().join("/");
    const ToDay = WhitchDay(new Date(UTC1DayDate).getDay() as DateOfWeek);
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
export const ToggleFav = async (AnimeId: string, currentVal: boolean) => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      AnimeId
    );

    await updateDoc(AnimeRef, {
      Fav: !currentVal,
    });

    !currentVal && toast.success("Successfully added to your favorite");
    currentVal && toast.success("Successfully removed from your favorite");
  } catch (err) {
    toast.error("Cannot add this anime to your favorite");
  }
};

/**
 * Toggle User Anime Fav Field
 * @returns {AdkamiLastReleasedEpisodeShape[]} Array of last released anime episodes in the world
 */
export const GetLastReleasedAnimeEp = (): Promise<
  AdkamiLastReleasedEpisodeShape[]
> => {
  console.log("Brute Force 'GetLastReleasedAnimeEp' Called");
  const fetchData = async (): Promise<
    AdkamiLastReleasedEpisodeShape[] | false
  > => {
    try {
      const LastAnimeEp:
        | AdkamiLastReleasedEpisodeShape[]
        | ADKamiScrapperApiERROR = await callApi({
        url: `https://adkami-scapping-api.herokuapp.com/last`,
      });

      if (!LastAnimeEp || (LastAnimeEp as ADKamiScrapperApiERROR)?.statusCode)
        return false;

      return LastAnimeEp as AdkamiLastReleasedEpisodeShape[];
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return new Promise((resolve, reject) => {
    let i = 0;

    try {
      const repeatFetching = async () => {
        const LastEpData = await fetchData();
        if (i > 15) return reject("Error: Cannot fetch Last Released Ep");

        if (!LastEpData) {
          i++;
          setTimeout(repeatFetching, 3000);
          return;
        }

        resolve(LastEpData as AdkamiLastReleasedEpisodeShape[]);
      };
      repeatFetching();
    } catch (err) {
      reject("Error: Cannot fetch Last Released Ep");
    }
  });
};

/**
 * Check User Connection (in realtime)
 */
export const NetworkCheck = () => {
  // Func
  const onChangeNetwork = (e: Event) =>
    CheckConn(e.currentTarget as unknown as NetworkInformationShape);

  const CheckConn = (ConnInfo: NetworkInformationShape) => {
    if (
      ConnInfo?.effectiveType === "slow-2g" ||
      ConnInfo?.effectiveType === "2g"
    ) {
      toast.error(`Unstable internet connection (${ConnInfo?.effectiveType})`, {
        position: "bottom-right",
      });
    }

    if (ConnInfo?.downlink === 0) {
      toast.error(`You are offline`, {
        position: "bottom-right",
      });
      if (window.location.pathname === "/_offline") return;
      history.pushState("", "", "/_offline");
      window.location.reload();
    }
  };
  // Main
  const connectionInfo =
    navigator.connection as unknown as NetworkInformationShape;
  if (connectionInfo?.onchange) connectionInfo.onchange = onChangeNetwork;
  CheckConn(connectionInfo);
};

/**
 * Activate/Desactivate Fullscreen
 * @param {"activate" | "desactivate"} action
 */
export const ManageFullScreen = async (action: "activate" | "desactivate") => {
  try {
    if (action === "activate" && !document.fullscreenElement)
      return await document?.documentElement?.requestFullscreen();
    if (action === "desactivate" && document.fullscreenElement)
      return await document?.exitFullscreen();
  } catch (err) {}
};
