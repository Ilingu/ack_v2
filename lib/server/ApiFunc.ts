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
  ResApiRoutes,
} from "../utils/types/interface";
import type { AnimeDatasShape } from "../utils/types/types";
// Func
import { IsError, decryptDatas } from "../utils/UtilsFunc";
import { callApi, JikanApiToAnimeShape } from "../client/ClientFuncs";

/* BEWARE!!! Function only executable on the backend, if you try to import from the frontend: error */

/**
 * Return API Response Error Object
 * @param {number} code Code of error (4**)
 * @param {string} reason Reason of error/failure
 * @returns {ResApiRoutes} ResApiRoutes interface
 */
export const ErrorHandling = (code: number, reason?: string): ResApiRoutes => {
  console.error(reason);
  return { succeed: false, code, message: reason };
};

/**
 * Return API Response Success Object
 * @param {number} code Code of success (2**)
 * @param {object} data Data to send back to the client
 * @returns {ResApiRoutes} ResApiRoutes interface
 */
export const SuccessHandling = (code: number, data?: object): ResApiRoutes => {
  return { succeed: true, code, data };
};

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
      await callApi<JikanApiResAnimeRoot>({
        url: endpoint,
      });

    let animeEpsRes = await getAllTheEpisodes(animeId);
    const { success: suc2, data: animeRecommendationsResData } =
      await callApi<JikanApiResRecommandationsRoot>({
        url: endpoint + "/recommendations",
      });

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
      const url = encodeURI(
        `https://9anime.id/filter?season[]=${season}&year[]=${year}&type[]=${type.toLowerCase()}&language[]=subbed&keyword=${name}`
      );
      TemplateURLs.push(url);
    }

    const MaybyUrlLinks = await Promise.allSettled(
      TemplateURLs.map(async (url) => {
        return new Promise<string>(async (res, rej) => {
          const response = await fetch(url);
          if (!response.ok) return rej();

          const HTMLDoc = await response.text();

          const cheerio = await import("cheerio");
          const $ = cheerio.load(HTMLDoc);
          const UrlLink = $(".anime-list:first-child > li > a").attr("href");

          if (
            !UrlLink ||
            UrlLink.trim().length <= 0 ||
            !UrlLink.startsWith("/watch/")
          )
            return rej();

          return res(UrlLink);
        });
      })
    );

    for (const UrlLinkRes of MaybyUrlLinks) {
      if (UrlLinkRes.status === "rejected") continue;

      const UrlLink = UrlLinkRes?.value;
      if (!UrlLink || !UrlLink || UrlLink.trim().length <= 0) continue;

      return UrlLinkRes?.value;
    }

    return null;
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

export const FbAuthentificate = async (
  AuthToken: string
): Promise<FunctionJob> => {
  try {
    const EncryptedToken = Buffer.from(AuthToken, "base64");
    const decryptedToken = decryptDatas(EncryptedToken);
    await auth.verifyIdToken(decryptedToken);
    return { success: true };
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
        let { success, data: eps } = await callApi<JikanApiResEpisodesRoot>({
          url: `https://api.jikan.moe/v4/anime/${id}/episodes?page=${i}`,
        });
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
