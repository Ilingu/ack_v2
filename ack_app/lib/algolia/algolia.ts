import algoliasearch from "algoliasearch/lite";
import { AlgoliaDatasShape, FunctionJob } from "../utils/types/interface";

const isTestEnv = process.env.NODE_ENV === "test";

const AlgoliaClient =
  !isTestEnv &&
  algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    process.env.NEXT_PUBLIC_ALGOLIA_PUBLIC_KEY
  );
const SearchDB = !isTestEnv && AlgoliaClient.initIndex("prod_ACK");

/**
 * Search Animes with is title in Algolia DB
 * @param {string} queryString
 */
export const SearchAnimeInAlgolia = async (
  queryString: string
): Promise<FunctionJob<AlgoliaDatasShape[]>> => {
  try {
    const resAnimes = await SearchDB.search(queryString);
    if (!resAnimes) return { success: false }; // "Cannot Get From Algolia"

    return {
      success: true,
      data: resAnimes.hits as unknown as AlgoliaDatasShape[],
    };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
