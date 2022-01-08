import { doc, getDoc, writeBatch } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import {
  AnimeConfigPathsIdShape,
  AnimeShape,
  JikanApiERROR,
  JikanApiResAnimeRoot,
  JikanApiResRecommandationsRoot,
} from "../../lib/types/interface";
import {
  callApi,
  getAllTheEpisodes,
  IsError,
  JikanApiToAnimeShape,
} from "../../lib/utilityfunc";

export default async function AddNewAnimeToFB(
  { query: { animeid } }: NextApiRequest,
  res: NextApiResponse
) {
  let animeData: AnimeShape;
  const animeId = animeid.toString();
  try {
    const endpoint = `https://api.jikan.moe/v4/anime/${animeId}`;
    // Req
    const { data: animeRes }: JikanApiResAnimeRoot = await callApi(endpoint);
    let animeEpsRes = await getAllTheEpisodes(animeId);
    const animeRecommendationsRes: JikanApiResRecommandationsRoot =
      await callApi(endpoint + "/recommendations");

    if (
      IsError(animeRes as unknown as JikanApiERROR) ||
      IsError(animeRecommendationsRes as unknown as JikanApiERROR)
    ) {
      return res
        .status((animeRes as unknown as JikanApiERROR).status)
        .json({ message: `Error when fetching: ${animeId}.`, err: true });
    }

    if (animeEpsRes.length <= 0)
      animeEpsRes = Array.apply(null, Array(12)).map((_: null, i) => ({
        mal_id: i + 1,
      }));

    const AllAnimeData = await Promise.all([
      animeRes,
      animeEpsRes,
      animeRecommendationsRes.data,
    ]);

    let IsGood = true;
    AllAnimeData || (IsGood = false);
    AllAnimeData.forEach((oneData) => {
      if (!oneData) IsGood = false;
    });

    if (IsGood) {
      animeData = JikanApiToAnimeShape(AllAnimeData);

      const batch = writeBatch(db);

      const newAnimesRef = doc(db, "animes", animeId);
      batch.set(newAnimesRef, animeData);

      const animesConfigPathsRef = doc(db, "animes", "animes-config");
      const animesConfigPaths = (
        await getDoc(animesConfigPathsRef)
      ).data() as AnimeConfigPathsIdShape;

      const ArrayPathsToObjPaths = animesConfigPaths.AllAnimeId.reduce(
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
      return res.status(200).json(animeData);
    }
    return res
      .status(404)
      .json({ message: `Anime with id: ${animeId} not found.`, err: true });
  } catch (err) {
    console.error(err);
    return res
      .status(404)
      .json({ message: `Anime with id: ${animeId} not found.`, err: true });
  }
}
