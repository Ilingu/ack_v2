import { auth, db } from "../firebase/firebase-admin";
import { IndexAnimeInAlgolia } from "../algolia/algolia-admin";
// Types
import type {
  AnimeConfigPathsIdShape,
  AnimeShape,
  FunctionJob,
  InternalApiResError,
  InternalApiResSuccess,
  JikanApiERROR,
  JikanApiResAnime,
  JikanApiResAnimeRoot,
  JikanApiResEpisodes,
  JikanApiResEpisodesRoot,
  JikanApiResRecommandationsRoot,
} from "../utils/types/interface";
import type { AnimeDatasShape, AnimeStatusType } from "../utils/types/types";
// Func
import { IsError, decryptDatas, IsEmptyString } from "../utils/UtilsFunc";
import { callApi, removeParamsFromPhotoUrl } from "../client/ClientFuncs";

/* BEWARE!!! Function only executable on the backend, if you try to import from the frontend: error */

/**
 * Return Is The Host Is BlackListed
 * @param {string} host The Host To Test
 * @returns {boolean} True = BlackListed || False = WhiteListed
 */
export const IsBlacklistedHost = (host: string): boolean => {
  const WhiteListedHost = ["ack.vercel.app", "localhost:3000"];
  return !WhiteListedHost.includes(host);
};

/**
 * Fetch Anime Data
 * @param {string} animeId
 */
export const GetAnimeData = async (
  animeId: string
): Promise<InternalApiResSuccess | InternalApiResError> => {
  let animeData: AnimeShape;
  try {
    const endpoint = `https://api.jikan.moe/v4/anime/${animeId}`;
    // Req
    const { success: suc1, data: animeResData } =
      await callApi<JikanApiResAnimeRoot>(endpoint);

    let animeEpsRes = await getAllTheEpisodes(animeId);
    const { success: suc2, data: animeRecommendationsResData } =
      await callApi<JikanApiResRecommandationsRoot>(
        endpoint + "/recommendations"
      );

    if (
      !suc1 ||
      !suc2 ||
      IsError(animeResData?.data as unknown as JikanApiERROR) ||
      IsError(animeRecommendationsResData?.data as unknown as JikanApiERROR)
    )
      return { message: `Error when fetching: ${animeId}.`, err: true };

    const { data: animeRes } = animeResData;
    const { data: animeRecommendationsRes } = animeRecommendationsResData;

    // Episodes Generation
    const EpisodesLength = animeEpsRes?.length || 0;
    let AnimeEpsDatas: JikanApiResEpisodes[] = [];

    if (EpisodesLength < (animeRes?.episodes || 12)) {
      const NonMissingEp = animeEpsRes.map(({ mal_id }) => mal_id);
      for (let i = 1; i <= (animeRes?.episodes || 12); i++) {
        const EpToAdd: JikanApiResEpisodes = NonMissingEp.includes(i)
          ? animeEpsRes.find(({ mal_id }) => mal_id === i)
          : {
              mal_id: i,
            };
        AnimeEpsDatas = [...AnimeEpsDatas, EpToAdd];
      }
    } else AnimeEpsDatas = animeEpsRes;

    // 9anime url link
    const NineAnimeLink = await Fetch9AnimeLink(animeRes);

    const AnimeDatas: AnimeDatasShape = [
      animeRes,
      AnimeEpsDatas,
      animeRecommendationsRes,
      NineAnimeLink,
    ];

    let IsGood = true;
    if (!AnimeDatas || AnimeDatas.filter((ad) => !!ad).length < 3)
      IsGood = false;

    if (IsGood) {
      const { AnimeData, IsAddableToDB } = JikanApiToAnimeShape(AnimeDatas);
      animeData = AnimeData;

      let AddedToDB = false;
      let AnimeUpdated = false;
      if (IsAddableToDB) {
        [AddedToDB, AnimeUpdated] = await AddNewGlobalAnime(animeId, animeData);
        await IndexAnimeInAlgolia({
          title: animeData.title,
          AlternativeTitle: animeData.AlternativeTitle,
          OverallScore: animeData.OverallScore,
          objectID: animeData.malId,
          photoPath: animeData.photoPath,
          type: animeData.type,
        });
      }

      return { AddedToDB, AnimeUpdated, AnimeData: animeData };
    }
    return { message: `Anime with ID "${animeId}" NotFound`, err: true };
  } catch (err) {
    console.error(err);
    return { message: err, err: true };
  }
};

const Fetch9AnimeLink = async (
  data: JikanApiResAnime
): Promise<string | null> => {
  try {
    // Filter Data
    const {
      title,
      type,
      year,
      season,
      title_japanese,
      title_english,
      title_synonyms,
    } = data;

    const TemplateURLs = [];
    const TitlesItarable = [
      title,
      title_japanese,
      title_english,
      ...title_synonyms,
    ];
    for (const name of TitlesItarable) {
      const NineAnimeQuery = encodeURIComponent(
        `https://9anime.id/filter?season[]=${season}&year[]=${year}&type[]=${type.toLowerCase()}&language[]=subbed&keyword=${name}`
      );
      const URLQuery = `https://api.webscrapingapi.com/v1?api_key=${process.env.WEB_SCAPPING_API_KEY}&url=${NineAnimeQuery}&device=desktop&proxy_type=datacenter`;
      TemplateURLs.push(URLQuery);
    }

    const cheerio = await import("cheerio");
    const AttemptGettingNineAnimeUrl = (): Promise<string> =>
      new Promise((res) => {
        let i = 0;
        const FetchingLink = async () => {
          if (i > TemplateURLs.length - 1) return res(null);

          const response = await fetch(TemplateURLs[i]);
          if (!response.ok) {
            i++;
            return FetchingLink();
          }

          const HTMLDoc = await response.text();

          const $ = cheerio.load(HTMLDoc);
          const UrlLink = $(".anime-list:first-child > li > a").attr("href");

          if (IsEmptyString(UrlLink) || !UrlLink.startsWith("/watch/")) {
            i++;
            return FetchingLink();
          }

          return res(UrlLink);
        };
        FetchingLink();
      });

    const UrlLink = await AttemptGettingNineAnimeUrl();
    return UrlLink;
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Add Anime Data To FB
 * @param {string} animeId
 * @param {AnimeShape} animeData
 */
const AddNewGlobalAnime = async (
  animeId: string,
  animeData: AnimeShape
): Promise<[boolean, boolean]> => {
  try {
    const batch = db.batch();

    const newAnimesRef = db.collection("animes").doc(animeId);
    const UpdateAnime = (await newAnimesRef.get()).exists;
    batch.set(newAnimesRef, animeData);

    const animesConfigPathsRef = db.collection("animes").doc("animes-config");
    const animesConfigPaths = (
      await animesConfigPathsRef.get()
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

    await batch.commit(); // Commit FB Change
    return [true, UpdateAnime]; // Return Success
  } catch (err) {
    console.error(err);
    return [false, false];
  }
};

/**
 * Login to firebase user account from backend (via user JWT Token)
 * @param {string} AuthToken
 * @returns {FunctionJob<string>} `{success: boolean, data: string}`, if success `false` data return null; `data` is the user `uid`
 */
export const FbAuthentificate = async (
  AuthToken: string
): Promise<FunctionJob<string>> => {
  try {
    const EncryptedToken = Buffer.from(AuthToken, "base64");
    const decryptedToken = decryptDatas(EncryptedToken);

    const { uid } = await auth.verifyIdToken(decryptedToken);
    return { success: true, data: uid };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Fetch All Ep Of An Anime
 * @param {string} id
 * @returns {Promise<JikanApiResEpisodes[]>} Promise Array with all anime eps
 */
export function getAllTheEpisodes(id: string): Promise<JikanApiResEpisodes[]> {
  return new Promise(async (resolve, reject) => {
    let Episodes: JikanApiResEpisodes[] = [];
    let i = 1;

    const fetchOtherEP = async () => {
      try {
        let { success, data: eps } = await callApi<JikanApiResEpisodesRoot>(
          `https://api.jikan.moe/v4/anime/${id}/episodes?page=${i}`
        );
        if (
          !success ||
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

/* HELPERS */
interface SpecialAnimeShape {
  AnimeData: AnimeShape;
  IsAddableToDB: boolean;
}
/**
 * Transform JikanApi obj (External API) to AnimeShape obj (Readable by the app, and stored in Firebase)
 * @param {AnimeDatasShape} JikanObj
 * @returns {SpecialAnimeShape} `{AnimeData: AnimeShape, IsAddableToDB: boolean}` --> `AnimeData` is the AnimeShape obj and `IsAddableToDB` is a boolean to say if this anime is worth to be stored into DB
 */
export function JikanApiToAnimeShape(
  JikanObj: AnimeDatasShape
): SpecialAnimeShape {
  const [AnimeData, EpsData, Recommendations, NineAnimeUrl] = JikanObj;
  let NextRefresh: number = null,
    NextEpsReleaseDate: number[] = null;
  let IsAddableToDB = true;

  const NewSeasonAnime =
    AnimeData?.airing ||
    !AnimeData?.aired?.to ||
    (AnimeData?.status as AnimeStatusType) === "Not yet aired";

  if (NewSeasonAnime) NextRefresh = Date.now() + 345600000;
  if (NewSeasonAnime && AnimeData?.aired?.from) {
    const FirstEpReleaseDate = new Date(AnimeData.aired.from).getTime();
    NextEpsReleaseDate = EpsData.map(({ aired }, i) => {
      if (!aired) return FirstEpReleaseDate + 604800000 * i;
      return new Date(aired).getTime();
    });
  }
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
        !IsEmptyString(AnimeData?.broadcast?.string) &&
        AnimeData?.broadcast?.string !== "Unknown"
          ? AnimeData.broadcast.string
          : null,
      NextRefresh,
      NineAnimeUrl,
      NextEpisodesReleaseDate: NextEpsReleaseDate,
    },
    IsAddableToDB,
  };
}
