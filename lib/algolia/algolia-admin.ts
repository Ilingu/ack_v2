import algoliasearch from "algoliasearch";
import { AnimeShape } from "../utils/types/interface";

const AlgoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_PRIVATE_KEY
);
const SearchDB = AlgoliaClient.initIndex("prod_ACK");

// [UPGRADE]: Only Stock PosterSearchData require for the index display
// Because here we stock AnimeShape Datas, and that a lot

/**
 * Index a New Anime in Algoria
 * @param {AlgoliaDataShape} animeData
 */
export const IndexAnimeInAlgolia = async (animeData: AnimeShape) => {
  try {
    const AlreadyExist = await SearchDB.search(animeData?.title);
    if (AlreadyExist && AlreadyExist?.hits.length > 0)
      throw new Error("Already Exist");

    await SearchDB.saveObject(animeData, {
      autoGenerateObjectIDIfNotExist: true,
    });
  } catch (err) {
    console.error(err);
  }
};
