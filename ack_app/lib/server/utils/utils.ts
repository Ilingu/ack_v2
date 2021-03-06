import { SupportedAnimeProvider } from "../../utils/types/enums";
import {
  AnimeVibeApiSearchResp,
  ProviderLinkInfo,
  ProviderLinkInfoShape,
} from "../../utils/types/interface";
import { IsEmptyString } from "../../utils/UtilsFuncs";

const { GOGOANIME, ANIMEVIBE } = SupportedAnimeProvider;

export const GenerateProvidersTitles = (
  AnimeTitles: string[]
): ProviderLinkInfo => {
  const PROVIDERS: SupportedAnimeProvider[] = [
    // ANIMIXPLAY, --> Not Supported anymore, @see note at `FetchAnimixLink()` function
    GOGOANIME,
    ANIMEVIBE,
  ];

  const providersTitles: ProviderLinkInfo = {};
  for (const provider of PROVIDERS) {
    const providerTitles: ProviderLinkInfoShape[] = [];
    for (const title of AnimeTitles) {
      const TrimmedTitle = encodeURI(
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9- ]/g, "")
          .replace(new RegExp(" ", "g"), "-")
          .replace(new RegExp("---", "g"), "--")
          .replace(new RegExp("--", "g"), "-")
      ); // title to simulate right anime page url
      const SafeTitle = encodeURIComponent(title.trim()); // Title to search (in url)
      if (TrimmedTitle.trim().length <= 0) continue;

      providerTitles.push({
        title: TrimmedTitle,
        SafeTitle,
      });
    }
    providersTitles[provider] = providerTitles;
  }

  return providersTitles;
};

// HOF -- High Order Function, that handle the array call 1 by 1
export const AttemptFetchProvider = (
  titles: ProviderLinkInfoShape[],
  fn: typeof FetchGogoLink
): Promise<string> =>
  new Promise((res) => {
    let i = 0;
    const Next = () => {
      i++;
      TryToFetch();
    };

    const TryToFetch = async () => {
      if (i > titles.length - 1) return res(null);

      const fnResult = await fn(titles[i]);
      if (!fnResult) return Next();
      return res(fnResult);
    };
    TryToFetch();
  });

export const FetchAnimixLink = async ({
  title,
  SafeTitle,
}: ProviderLinkInfoShape): Promise<string> => {
  try {
    /* README: `FetchAnimixLink()` doesn't currently work, because of Cloudfare protection.
                    It's simple to bypass, however I have to use an Scrapping API for that, and it may be really long to extract the link (an anime fetch is composed of multiples providers having several links to tests, so if 1 scrap is long, I can't imagine for 3, the user must not wait!).
                    But all of this doesn't really care because animixplay uses third-party to work (like ack), and more precisly it use Gogoanime, yet you can see that I know how to successfully scrap Gogoanime `@see FetchGogoLink()`, thus Animix too.
        */
    return null;
    // Method 1
    const directUrl = `https://api.scrapingant.com/v1/general?url=https%3A%2F%2Fanimixplay.to%2Fv1%2F${title}&browser=false`;
    const urlResp = await fetch(directUrl);

    if (urlResp.ok) return directUrl; // skip 2nd method

    // Method 2: Search Page and crawling of the provider
    const searchResp = await fetch("https://cachecow.eu/api/search", {
      method: "POST",
      body: `qfast=${SafeTitle}&root=animixplay.to`,
    });
    if (!searchResp.ok) return null;

    const ext = await searchResp.text();
    console.log(ext);
    const searchResult: { result: string } = await searchResp.json();
    if (!searchResult?.result) return null;

    const cheerio = await import("cheerio"); // cheerio for html files crawling
    const $ = cheerio.load(searchResult.result);

    const Selector = "#resultplace #result1 > ul > li > p.name > a";
    const PathLink = $(Selector).attr("href");

    if (IsEmptyString(PathLink) || !PathLink.startsWith("/v1/")) return null;

    return `https://animixplay.to${PathLink}`;
  } catch (err) {
    return null;
  }
};

export const FetchGogoLink = async ({
  title,
  SafeTitle,
}: ProviderLinkInfoShape): Promise<string> => {
  try {
    // Method 1
    const directUrl = `https://gogoanime.lu/category/${title}`;
    const urlResp = await fetch(directUrl);

    if (urlResp.ok) return directUrl; // skip 2nd method

    // Method 2: Search Page and crawling of the provider
    const searchUrl = `https://gogoanime.lu/search.html?keyword=${SafeTitle}`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return null;

    const cheerio = await import("cheerio"); // cheerio for html files crawling
    const $ = cheerio.load(await searchResp.text());

    const GogoSelector =
      "#wrapper_bg div.last_episodes ul.items > li > div.img > a";
    const GogoPath = $(GogoSelector).attr("href");

    if (IsEmptyString(GogoPath) || !GogoPath.startsWith("/category/"))
      return null;

    return `https://gogoanime.lu${GogoPath}`;
  } catch (err) {
    return null;
  }
};

export const FetchAnimeVibeLink = async ({
  title,
  SafeTitle,
}: ProviderLinkInfoShape): Promise<string> => {
  try {
    // Method 1
    const directUrl = `https://lite-api.animemate.xyz/Anime/${title}`;
    const urlResp = await fetch(directUrl);
    const RespToText = await urlResp.text();

    if (urlResp.ok && RespToText !== "Error: Anime not Found")
      return `https://lite.animevibe.se/anime/${title}`; // skip 2nd method

    // Method 2: Search Page and crawling of the provider
    const searchUrl = `https://lite-api.animemate.xyz/Search/${SafeTitle}`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return null;

    const AnimeVibeAPIResp: AnimeVibeApiSearchResp = await searchResp.json();
    if (AnimeVibeAPIResp.length === 0) return null;

    const AnimeSearchObj = AnimeVibeAPIResp[0];
    if (
      !AnimeSearchObj?.url ||
      IsEmptyString(AnimeSearchObj.url) ||
      !AnimeSearchObj.url.startsWith("/anime/")
    )
      return null;

    return `https://lite.animevibe.se${AnimeSearchObj.url}`;
  } catch (err) {
    return null;
  }
};
