import algoliasearch from "algoliasearch";
import { AlgoliaDatasShape } from "../utils/types/interface";

const isTestEnv = process.env.NODE_ENV === "test";

const AlgoliaClient =
  !isTestEnv &&
  algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    process.env.ALGOLIA_PRIVATE_KEY
  );
const SearchDB = !isTestEnv && AlgoliaClient.initIndex("prod_ACK");

/**
 * Index a New Anime in Algoria
 * @param {AlgoliaDataShape} animeData
 */
export const IndexAnimeInAlgolia = async (animeData: AlgoliaDatasShape) => {
  try {
    await SearchDB.saveObject(animeData);
  } catch (err) {
    console.error(err);
  }
};
