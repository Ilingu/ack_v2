import { doc, getDoc, writeBatch } from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import {
  AnimeConfigPathsIdShape,
  AnimeShape,
  JikanApiResAnime,
  JikanApiResRecommandations,
} from "../../lib/types/interface";
import {
  callApi,
  getAllTheEpisodes,
  JikanApiToAnimeShape,
} from "../../lib/utilityfunc";

export default async function AddNewAnimeToFB(
  { query: { animeid } }: NextApiRequest,
  res: NextApiResponse
) {
  let animeData: AnimeShape;
  const animeId = animeid.toString();
  try {
    const endpoint = `https://api.jikan.moe/v3/anime/${animeId}`;
    // Req
    const animeRes: JikanApiResAnime = await callApi(endpoint);
    let animeEpsRes = await getAllTheEpisodes(animeId);
    const animeRecommendationsRes: JikanApiResRecommandations = await callApi(
      endpoint + "/recommendations"
    );
    if (animeEpsRes.length <= 0)
      animeEpsRes = Array.apply(null, Array(12)).map((_: null, i: number) => ({
        episode_id: i + 1,
      }));
    const AllAnimeData = await Promise.all([
      animeRes,
      animeEpsRes,
      animeRecommendationsRes,
    ]);

    let IsGood = true;
    AllAnimeData || (IsGood = false);
    [AllAnimeData[0], AllAnimeData[2]].forEach((oneData) => {
      if (!oneData || oneData.status === 404) IsGood = false;
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
      const newAnimeConfigPaths = {
        AllAnimeId: [...animesConfigPaths?.AllAnimeId, animeId],
      };
      batch.update(animesConfigPathsRef, newAnimeConfigPaths);

      await batch.commit();
    } else
      res.status(404).json({ message: `User with id: ${animeId} not found.` });
  } catch (err) {
    res.status(404).json({ message: `User with id: ${animeId} not found.` });
  }

  res.status(200).json(animeData);
}
