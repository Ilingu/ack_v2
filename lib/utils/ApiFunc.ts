import { randomUUID } from "crypto";
import { db } from "../firebase-admin";
import {
  AnimeConfigPathsIdShape,
  AnimeShape,
  InternalApiResError,
  JikanApiERROR,
  JikanApiResAnimeRoot,
  JikanApiResRecommandationsRoot,
  ResApiRoutes,
} from "./types/interface";
import {
  callApi,
  getAllTheEpisodes,
  IsError,
  JikanApiToAnimeShape,
} from "./UtilsFunc";

export const ErrorHandling = (code: number, reason?: string): ResApiRoutes => ({
  succeed: false,
  code,
  message: reason,
});
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
      const { AnimeData, IsAddableToDB } = JikanApiToAnimeShape(AllAnimeData);
      animeData = AnimeData;

      let IsAddedToDB = false;
      if (IsAddableToDB)
        IsAddedToDB = await AddNewGlobalAnime(animeId, animeData);

      return animeData;
    }
    return { message: JSON.stringify(AllAnimeData), err: true };
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
