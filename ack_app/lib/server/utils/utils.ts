import { FunctionJob } from "../../utils/types/interface";
import { IsEmptyString, isValidUrl } from "../../utils/UtilsFuncs";

/* SITE PROVIDER:
  1. https://gogoanime.lu/category/*    --> Can Directly Check URL + good search + good vid player and communauty ✅✅
  ------------------------------------------------------------------------------------------------------------
  - https://9anime.id/ --> Don't support anymore (tedious bot protection that I successfully bypass but compared to the 4 providers above it takes ~5-10s to extract the link from 9anime whereas for the others, I don't have to "extract" the link because it's just string templating and checking if that works or not...)
  [DEAD] https://animixplay.to/             --> Best UI ✅ Uses GogoAnime under the hood ✅✅
*/

/**
 * Generate and return the working Streaming Providers Link
 * @param {ProviderLinkInfo} providersTitles Array of the anime mutliples titles (e.g: Shingeki No Kyojin,Attack On Titan...)
 * @return {string[]} Array of working providers anime link
 */
export const fetchProviderLink = async (
  titles: string[]
): Promise<string | null> => {
  const searchPromises = titles.map(SearchAnimePahe);

  for await (const { success, data } of searchPromises) {
    if (!success) continue;
    return data;
  }
  return null;
};

interface AnimePaheRes {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  data: AnimeSearchShape[];
}

interface AnimeSearchShape {
  id: number;
  title: string;
  type: string;
  episodes: number;
  status: string;
  season: string;
  year: number;
  score?: number;
  poster: string;
  session: string;
}

const SearchAnimePahe = async (title: string): Promise<FunctionJob<string>> => {
  const url = `https://animepahe.ru/api?m=search&q=${title}`;
  const scrapUrl = `https://api.scrapingant.com/v1/general?url=${encodeURIComponent(
    url
  )}&browser=false`;
  if (isValidUrl(scrapUrl)) return { success: false };

  try {
    const result = await fetch(url);
    if (result.ok) return { success: false };

    const data: AnimePaheRes = await result.json();
    if (!data?.data || data.data.length <= 0) return { success: false };
    if (IsEmptyString(data.data[0]?.session)) return { success: false };

    return { success: true, data: data.data[0].session };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
// https://animepahe.ru/api?m=search&q=cool%20doji%20doshi
