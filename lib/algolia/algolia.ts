import algoliasearch from "algoliasearch/lite";
import { AlgoliaDatasShape, AlgoliaResShape } from "../utils/types/interface";

const AlgoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_PUBLIC_KEY
);
const SearchDB = AlgoliaClient.initIndex("prod_ACK");

/**
 * Search Animes with is title in Algolia DB
 * @param {string} queryString
 */
export const SearchAnimeInAlgolia = async (
  queryString: string
): Promise<AlgoliaResShape> => {
  try {
    const resAnimes = await SearchDB.search(queryString);
    if (!resAnimes) throw new Error("Cannot Get From Algolia");
    return {
      success: true,
      data: resAnimes.hits as unknown as AlgoliaDatasShape[],
    };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
