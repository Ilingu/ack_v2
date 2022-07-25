import { auth, db } from "../firebase/firebase-admin";
import { IndexAnimeInAlgolia } from "../algolia/algolia-admin";
// Types
import type {
  AnimeConfigPathsIdShape,
  AnimeShape,
  FunctionJob,
  InternalApiResSuccess,
  JikanApiERROR,
  JikanApiResAnime,
  JikanApiResAnimeRoot,
  JikanApiResEpisodes,
  JikanApiResEpisodesRoot,
  JikanApiResRecommandationsRoot,
  NineAnimeAPIResShape,
} from "../utils/types/interface";
import type { AnimeDatasShape, AnimeStatusType } from "../utils/types/types";
// Func
import { IsError, decryptDatas, IsEmptyString } from "../utils/UtilsFuncs";
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
): Promise<FunctionJob<InternalApiResSuccess>> => {
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
      return { success: false };

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
      const MissingElems =
        EpisodesLength <= 0 ||
        !NineAnimeLink ||
        animeRecommendationsRes.length <= 0;

      const { AnimeData, IsAddableToDB } = JikanApiToAnimeShape(
        AnimeDatas,
        MissingElems
      );
      animeData = AnimeData;

      let AddedToDB = false;
      let AnimeUpdated = false;
      if (IsAddableToDB && process.env.NODE_ENV !== "test") {
        [AddedToDB, AnimeUpdated] = await AddNewGlobalAnime(animeId, animeData);
        IndexAnimeInAlgolia({
          title: animeData.title,
          AlternativeTitle: animeData.AlternativeTitle,
          OverallScore: animeData.OverallScore,
          objectID: animeData.malId,
          photoPath: animeData.photoPath,
          type: animeData.type,
        });
      }

      return {
        success: true,
        data: { AddedToDB, AnimeUpdated, AnimeData: animeData },
      };
    }
    return { success: false };
  } catch (err) {
    console.error(err);
    return { success: false };
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

    const TitlesItarable = [
      title,
      title_japanese,
      title_english,
      ...title_synonyms,
    ];
    const APIUrl = encodeURI(
      `https://ack-9anime-scrapping.up.railway.app/getLink?TitlesItarable=${TitlesItarable.join(
        ","
      )}&season=${season}&year=${year}&type=${type}`
    );

    // 3 attempts to get the url, if the 3 failed return null
    for (let i = 0; i < 3; i++) {
      console.log(i, APIUrl);
      const ApiRes = await fetch(APIUrl);
      if (!ApiRes.ok) {
        continue;
      }

      const { success, data: UrlLink }: NineAnimeAPIResShape =
        await ApiRes.json();
      console.log(UrlLink);
      if (!success || IsEmptyString(UrlLink) || !UrlLink.startsWith("/watch/"))
        continue;

      return UrlLink;
    }

    return null; // the 3 attemps failed...
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

    if (!animesConfigPaths?.AllAnimeId?.includes(animeId)) {
      const NewAnimeConfig = [...animesConfigPaths.AllAnimeId, animeId];
      batch.update(animesConfigPathsRef, {
        AllAnimeId: NewAnimeConfig,
      });
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
  JikanObj: AnimeDatasShape,
  MissingElems = false
): SpecialAnimeShape {
  const [AnimeData, EpsData, Recommendations, NineAnimeUrl] = JikanObj;
  let NextRefresh: number = null,
    NextEpsReleaseDate: number[] = null;
  let IsAddableToDB = true;

  const NewSeasonAnime =
    AnimeData?.airing ||
    !AnimeData?.aired?.to ||
    (AnimeData?.status as AnimeStatusType) === "Not yet aired";

  if (NewSeasonAnime || MissingElems) NextRefresh = Date.now() + 345600000; // 4 days
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
