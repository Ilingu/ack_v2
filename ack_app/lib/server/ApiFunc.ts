import { auth, db } from "../firebase/firebase-admin";
import { IndexAnimeInAlgolia } from "../algolia/algolia-admin";
// Types
import type {
  AnimeConfigPathsIdShape,
  AnimeShape,
  FunctionJob,
  InternalApiResSuccess,
  JikanApiERROR,
  JikanApiResAnimeRoot,
  JikanApiResEpisodes,
  JikanApiResEpisodesRoot,
  JikanApiResRecommandationsRoot,
} from "../utils/types/interface";
import type {
  AnimeDatasShape,
  AnimeProviders,
  AnimeStatusType,
} from "../utils/types/types";
// Func
import { IsError, decryptDatas, IsEmptyString } from "../utils/UtilsFuncs";
import { callApi, removeParamsFromPhotoUrl } from "../client/ClientFuncs";

/* BEWARE!!! Function only executable on the backend, if you try to import from the frontend: error */

/**
 * Return Is The Host Is BlackListed
 * @param {string} host The Host To Test
 * @returns {boolean} True = BlackListed || False = WhiteListed
 */
export const IsBlacklistedHost = (host: string): boolean => {
  const WhiteListedHost = ["ack.vercel.app", "localhost:3000"];
  return !WhiteListedHost.includes(host);
};

// export const HolyFunction = (animeIDs: string[]) => {
//   let i = 0;

//   const FetchUrl = async () => {
//     if (i > animeIDs.length - 1) return;
//     const animeToRevalidate = animeIDs[i];
//     console.log(`Processing anime #${animeIDs[i]}, i=${i}`);

//     const { success, data } = await GetAnimeData(animeToRevalidate);
//     console.log(`#${animeIDs[i]} succeed:`, JSON.stringify(success));
//     console.log(JSON.stringify(data?.AnimeData?.ProvidersLink));

//     await (() => new Promise((res) => setTimeout(res, 2500)))(); // wait 2.5s

//     i++;
//     FetchUrl();
//   };
//   FetchUrl();
// };

/**
 * Fetch Anime Data
 * @param {string} animeId
 */
export const GetAnimeData = async (
  animeId: string
): Promise<FunctionJob<InternalApiResSuccess>> => {
  let animeData: AnimeShape;
  try {
    const endpoint = `https://api.jikan.moe/v4/anime/${animeId}`;
    // Req
    const { success: suc1, data: animeResData } =
      await callApi<JikanApiResAnimeRoot>(endpoint);

    let animeEpsRes = await getAllTheEpisodes(animeId);
    const { success: suc2, data: animeRecommendationsResData } =
      await callApi<JikanApiResRecommandationsRoot>(
        endpoint + "/recommendations"
      );

    if (
      !suc1 ||
      !suc2 ||
      IsError(animeResData?.data as unknown as JikanApiERROR) ||
      IsError(animeRecommendationsResData?.data as unknown as JikanApiERROR)
    )
      return { success: false };

    const { data: animeRes } = animeResData;
    const { data: animeRecommendationsRes } = animeRecommendationsResData;

    // Episodes Generation
    const EpisodesLength = animeEpsRes?.length || 0;
    let AnimeEpsDatas: JikanApiResEpisodes[] = [];

    if (EpisodesLength < (animeRes?.episodes || 12)) {
      const NonMissingEp = animeEpsRes.map(({ mal_id }) => mal_id);
      for (let i = 1; i <= (animeRes?.episodes || 12); i++) {
        const EpToAdd: JikanApiResEpisodes = NonMissingEp.includes(i)
          ? animeEpsRes.find(({ mal_id }) => mal_id === i)
          : {
              mal_id: i,
            };
        AnimeEpsDatas = [...AnimeEpsDatas, EpToAdd];
      }
    } else AnimeEpsDatas = animeEpsRes;

    // 9anime url link
    const AnimeTitlesIterable = [
      animeRes?.title,
      animeRes?.title_japanese,
      animeRes?.title_english,
      ...(animeRes?.title_synonyms || []),
    ].filter((d) => d);
    const ProvidersLink = await FetchProvidersLink(AnimeTitlesIterable);

    const AnimeDatas: AnimeDatasShape = [
      animeRes,
      AnimeEpsDatas,
      animeRecommendationsRes,
      ProvidersLink,
    ];

    let IsGood = true;
    if (!AnimeDatas || AnimeDatas.filter((ad) => !!ad).length < 3)
      IsGood = false;

    if (IsGood) {
      const MissingElems =
        EpisodesLength <= 0 ||
        !ProvidersLink ||
        animeRecommendationsRes.length <= 0;

      const { AnimeData, IsAddableToDB } = JikanApiToAnimeShape(
        AnimeDatas,
        MissingElems
      );
      animeData = AnimeData;

      let AddedToDB = false;
      let AnimeUpdated = false;
      if (IsAddableToDB && process.env.NODE_ENV !== "test") {
        [AddedToDB, AnimeUpdated] = await AddNewGlobalAnime(animeId, animeData);
        IndexAnimeInAlgolia({
          title: animeData.title,
          AlternativeTitle: animeData.AlternativeTitle,
          OverallScore: animeData.OverallScore,
          objectID: animeData.malId,
          photoPath: animeData.photoPath,
          type: animeData.type,
        });
      }

      return {
        success: true,
        data: { AddedToDB, AnimeUpdated, AnimeData: animeData },
      };
    }
    return { success: false };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

/* SITE PROVIDER:
  1. https://gogoanime.lu/category/*    --> Can Check URL + good search ✅✅
  2. https://chia-anime.su/anime/*      --> Can Check URL, only latin letter search ❌
  2. https://kickassanime.su/anime/*    --> Can Check URL, only latin letter search ❌
  3. https://lite.animevibe.se/anime/*  --> Cannot Check If URL good or not ❌ + good search ✅
  ------------------------------------------------------------------------------------------------------------
  https://9anime.id/ --> Don't support anymore (tedious bot protection that I successfully bypass but compared to the 4 providers above it takes ~5-10s to extract the link from 9anime whereas for the others, I don't have to "extract" the link because it's just string templating and checking if that works or not...)
*/

/**
 * Generate and return the working Streaming Providers Link
 * @param {string[]} AnimeTitles Array of the anime mutliples titles (e.g: Shingeki No Kyojin,Attack On Titan...)
 * @return {string[]} Array of working providers anime link
 */
const FetchProvidersLink = async (
  AnimeTitles: string[]
): Promise<string[] | null> => {
  try {
    const PROVIDERS: AnimeProviders[] = [
      "https://gogoanime.lu/category",
      "https://chia-anime.su/anime",
      "https://kickassanime.su/anime",
      "https://lite.animevibe.se/anime",
    ];

    const providersLinks: string[][] = [];
    for (const provider of PROVIDERS) {
      const providerLinks: string[] = [];
      for (const title of AnimeTitles) {
        const TrimmedTitle = title
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9- ]/g, "")
          .replaceAll(" ", "-")
          .replaceAll("---", "--")
          .replaceAll("--", "-");

        if (TrimmedTitle.trim().length <= 0) continue;
        const providerLink = encodeURI(`${provider}/${TrimmedTitle}`);
        providerLinks.push(providerLink);
      }
      providersLinks.push(providerLinks);
    }

    const ProvidersResp = await Promise.allSettled(
      providersLinks.map(async (providerLink) => {
        const AttemptFetchUrl = (): Promise<string> =>
          new Promise((res, rej) => {
            let i = 0;
            const FetchUrl = async () => {
              if (i > providerLink.length - 1)
                return rej("cannot find anime link in all titles");

              const providerResp = await fetch(providerLink[i]);
              if (providerResp.ok) return res(providerLink[i]); // if page exist, skip

              /* TODO: if page result in 404 (or other): manual search page, template search + cheerio to grab dom elem 
              -> I didn't implement it yet because the first method works terribly well, but some very few cases, the first method don't work at all and this method (more time expensive but 100% accurate) would be great to have...*/
              // const cheerio = await import("cheerio");

              i++;
              FetchUrl();
            };
            FetchUrl();
          });
        return await AttemptFetchUrl();
      })
    );
    const ValidAnimeUrlLink = ProvidersResp.map((res) => {
      if (res.status === "fulfilled") return res.value;
      return null;
    }).filter((e) => e);

    return ValidAnimeUrlLink.length === 0 ? null : ValidAnimeUrlLink;
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Add Anime Data To FB
 * @param {string} animeId
 * @param {AnimeShape} animeData
 */
const AddNewGlobalAnime = async (
  animeId: string,
  animeData: AnimeShape
): Promise<[boolean, boolean]> => {
  try {
    const batch = db.batch();

    const newAnimesRef = db.collection("animes").doc(animeId);
    const UpdateAnime = (await newAnimesRef.get()).exists;
    batch.set(newAnimesRef, animeData);

    const animesConfigPathsRef = db.collection("animes").doc("animes-config");
    const animesConfigPaths = (
      await animesConfigPathsRef.get()
    ).data() as AnimeConfigPathsIdShape;

    if (!animesConfigPaths?.AllAnimeId?.includes(animeId)) {
      const NewAnimeConfig = [...animesConfigPaths.AllAnimeId, animeId];
      batch.update(animesConfigPathsRef, {
        AllAnimeId: NewAnimeConfig,
      });
    }

    await batch.commit(); // Commit FB Change
    return [true, UpdateAnime]; // Return Success
  } catch (err) {
    console.error(err);
    return [false, false];
  }
};

/**
 * Login to firebase user account from backend (via user JWT Token)
 * @param {string} AuthToken
 * @returns {FunctionJob<string>} `{success: boolean, data: string}`, if success `false` data return null; `data` is the user `uid`
 */
export const FbAuthentificate = async (
  AuthToken: string
): Promise<FunctionJob<string>> => {
  try {
    const EncryptedToken = Buffer.from(AuthToken, "base64");
    const decryptedToken = decryptDatas(EncryptedToken);

    const { uid } = await auth.verifyIdToken(decryptedToken);
    return { success: true, data: uid };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Fetch All Ep Of An Anime
 * @param {string} id
 * @returns {Promise<JikanApiResEpisodes[]>} Promise Array with all anime eps
 */
export function getAllTheEpisodes(id: string): Promise<JikanApiResEpisodes[]> {
  return new Promise(async (resolve, reject) => {
    let Episodes: JikanApiResEpisodes[] = [];
    let i = 1;

    const fetchOtherEP = async () => {
      try {
        let { success, data: eps } = await callApi<JikanApiResEpisodesRoot>(
          `https://api.jikan.moe/v4/anime/${id}/episodes?page=${i}`
        );
        if (
          !success ||
          IsError(eps as unknown as JikanApiERROR) ||
          !eps?.data ||
          eps?.data?.length <= 0 ||
          i >= 5
        )
          return resolve(Episodes);
        Episodes = [...Episodes, ...eps.data];
        if (!eps?.pagination.has_next_page) return resolve(Episodes);
        i++;
        setTimeout(fetchOtherEP, 4050);
      } catch (err) {
        reject(err);
      }
    };
    fetchOtherEP();
  });
}

/* HELPERS */
interface SpecialAnimeShape {
  AnimeData: AnimeShape;
  IsAddableToDB: boolean;
}
/**
 * Transform JikanApi obj (External API) to AnimeShape obj (Readable by the app, and stored in Firebase)
 * @param {AnimeDatasShape} JikanObj
 * @returns {SpecialAnimeShape} `{AnimeData: AnimeShape, IsAddableToDB: boolean}` --> `AnimeData` is the AnimeShape obj and `IsAddableToDB` is a boolean to say if this anime is worth to be stored into DB
 */
export function JikanApiToAnimeShape(
  JikanObj: AnimeDatasShape,
  MissingElems = false
): SpecialAnimeShape {
  const [AnimeData, EpsData, Recommendations, ProvidersLink] = JikanObj;
  let NextRefresh: number = null,
    NextEpsReleaseDate: number[] = null;
  let IsAddableToDB = true;

  const NewSeasonAnime =
    AnimeData?.airing ||
    !AnimeData?.aired?.to ||
    (AnimeData?.status as AnimeStatusType) === "Not yet aired";

  if (NewSeasonAnime || MissingElems) NextRefresh = Date.now() + 345600000; // 4 days
  if (NewSeasonAnime && AnimeData?.aired?.from) {
    const FirstEpReleaseDate = new Date(AnimeData.aired.from).getTime();
    NextEpsReleaseDate = EpsData.map(({ aired }, i) => {
      if (!aired) return FirstEpReleaseDate + 604800000 * i;
      return new Date(aired).getTime();
    });
  }
  if (
    !NewSeasonAnime &&
    AnimeData?.score < 6 &&
    AnimeData?.rank >= 1500 &&
    AnimeData?.members < 15000
  )
    IsAddableToDB = false;

  return {
    AnimeData: {
      title: AnimeData?.title,
      Genre: AnimeData?.genres,
      AgeRating: AnimeData?.rating,
      Airing: AnimeData?.airing,
      AiringDate: new Date(AnimeData?.aired?.from).toLocaleDateString(),
      AlternativeTitle: {
        title_english: AnimeData?.title_english,
        title_japanese: AnimeData?.title_japanese,
        title_synonyms: AnimeData?.title_synonyms,
      },
      OverallScore: AnimeData?.score,
      ScoredBy: AnimeData?.scored_by,
      Status: AnimeData?.status as AnimeStatusType,
      type: AnimeData?.type,
      ReleaseDate: `${AnimeData?.season} ${AnimeData?.year}`,
      Synopsis: AnimeData?.synopsis,
      Studios: AnimeData?.studios,
      Theme: AnimeData?.themes,
      photoPath: removeParamsFromPhotoUrl(AnimeData?.images?.jpg?.image_url),
      malId: AnimeData?.mal_id,
      trailer_url: AnimeData?.trailer?.embed_url,
      nbEp: AnimeData?.episodes || 12,
      MalPage: AnimeData?.url,
      duration: AnimeData?.duration,
      Recommendations:
        Recommendations?.slice(0, 7).map((recom) => ({
          ...recom,
          image_url: removeParamsFromPhotoUrl(
            recom?.entry?.images?.jpg?.image_url
          ),
        })) || [],
      EpisodesData:
        (AnimeData?.type === "TV" ||
          AnimeData?.type === "OVA" ||
          AnimeData?.type === "ONA") &&
        EpsData,
      broadcast:
        !IsEmptyString(AnimeData?.broadcast?.string) &&
        AnimeData?.broadcast?.string !== "Unknown"
          ? AnimeData.broadcast.string
          : null,
      NextRefresh,
      ProvidersLink,
      NextEpisodesReleaseDate: NextEpsReleaseDate,
    },
    IsAddableToDB,
  };
}
