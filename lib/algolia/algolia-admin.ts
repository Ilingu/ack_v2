import algoliasearch from "algoliasearch";
import { AnimeShape } from "../utils/types/interface";

const AlgoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_PRIVATE_KEY
);
const SearchDB = AlgoliaClient.initIndex("prod_ACK");

/**
 * Index a New Anime in Algoria
 * @param {AnimeShape} animeData
 */
export const IndexAnimeInAlgolia = async (animeData: AnimeShape) => {
  try {
    await SearchDB.saveObject(animeData, {
      autoGenerateObjectIDIfNotExist: true,
    });
  } catch (err) {
    console.error(err);
  }
};
