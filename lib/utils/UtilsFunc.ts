import crypto from "crypto";
// Types
import type {
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
import type {
  AnimeStatusType,
  DateOfWeek,
  DayOfWeek,
  TheFourSeason,
} from "./types/types";
import { AnimeWatchType } from "./types/enums";
// DB
import { doc, updateDoc, DocumentSnapshot } from "@firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { getDoc } from "firebase/firestore";
// UI
import toast from "react-hot-toast";

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
 * Revalidate Anime Via Internal API
 * @param {number | string} AnimeID The Host To Test
 */
export const RevalidateAnime = async (AnimeID: number | string) => {
  console.warn(`Revalidating ${AnimeID}...`);
  try {
    await callApi({
      url: `https://ack.vercel.app/api/revalidate/${AnimeID}`,
      internalCall: true,
    });
  } catch (err) {}
};

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
    photoUrl: removeParamsFromPhotoUrl(recomData.entry.images.jpg.image_url),
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
    PhotoUrl: removeParamsFromPhotoUrl(SeasonData.images.jpg.image_url),
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
 * @param {string} photoUrl
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

/**
 * Check the type of the device
 * @returns {"Mobile" | "PC"} the device type: "Mobile" or "PC"
 */
export const DeviceCheckType = (): "Mobile" | "PC" => {
  let check = false;
  ((a) => {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator?.userAgent || navigator?.vendor || window?.opera);
  return check ? "Mobile" : "PC";
};
