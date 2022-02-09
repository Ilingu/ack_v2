import { db } from "../firebase-admin";
import {
  AnimeConfigPathsIdShape,
  AnimeShape,
  InternalApiResError,
  InternalApiResSuccess,
  JikanApiERROR,
  JikanApiResAnime,
  JikanApiResAnimeRoot,
  JikanApiResEpisodes,
  JikanApiResEpisodesRoot,
  JikanApiResRecommandations,
  JikanApiResRecommandationsRoot,
  ResApiRoutes,
} from "./types/interface";
import { callApi, IsError, JikanApiToAnimeShape } from "./UtilsFunc";

type AnimeDatasShape = [
  JikanApiResAnime,
  JikanApiResEpisodes[],
  JikanApiResRecommandations[]
];

/**
 * Return API Response Error Object
 * @param {number} code Code of error (4**)
 * @param {string} reason Reason of error/failure
 * @returns {ResApiRoutes} ResApiRoutes interface
 */
export const ErrorHandling = (code: number, reason?: string): ResApiRoutes => ({
  succeed: false,
  code,
  message: reason,
});

/**
 * Return API Response Success Object
 * @param {number} code Code of success (2**)
 * @param {object} data Data to send back to the client
 * @returns {ResApiRoutes} ResApiRoutes interface
 */
export const SuccessHandling = (code: number, data?: object): ResApiRoutes => ({
  succeed: true,
  code,
  data,
});

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

    const EpisodesLength = animeEpsRes?.length || 0;
    if (EpisodesLength < 12) {
      // TODO: More Dyna (Ex: Princess Connect)
      // Where the 1 and 4 ep are added but not the 2-3
      // Do array of Missing Ep (if 1 and 4 don't miss add them, but the other generate them)
      for (let i = EpisodesLength; i < 12; i++) {
        animeEpsRes = [
          ...animeEpsRes,
          {
            mal_id: i + 1,
          },
        ];
      }
    }

    const AnimeDatas: AnimeDatasShape = [
      animeRes,
      animeEpsRes,
      animeRecommendationsRes,
    ];

    let IsGood = true;
    if (!AnimeDatas || AnimeDatas.filter((ad) => !!ad).length !== 3)
      IsGood = false;

    if (IsGood) {
      const { AnimeData, IsAddableToDB } = JikanApiToAnimeShape(AnimeDatas);
      animeData = AnimeData;

      let AddedToDB = false;
      if (IsAddableToDB)
        AddedToDB = await AddNewGlobalAnime(animeId, animeData);

      return { AddedToDB, AnimeData: animeData };
    }
    return { message: `Anime with ID "${animeId}" NotFound`, err: true };
  } catch (err) {
    console.error(err);
    return { message: err, err: true };
  }
};

/**
 * Fetch Anime Data
 * @param {string} animeId
 * @param {AnimeShape} animeData
 */
export const AddNewGlobalAnime = async (
  animeId: string,
  animeData: AnimeShape
): Promise<boolean> => {
  try {
    const batch = db.batch();

    const newAnimesRef = db.collection("animes").doc(animeId);
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

    await batch.commit();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
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
