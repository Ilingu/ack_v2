import { NextPage } from "next";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import debounce from "lodash.debounce";
// UI
import MetaTags from "../../components/Common/Metatags";
import Divider from "../../components/Design/Divider";
import AnimePoster from "../../components/Search/SearchPoster";
// Utility Func
import {
  AnimeShapeToPosterData,
  callApi,
  removeParamsFromPhotoUrl,
} from "../../lib/client/ClientFuncs";
import { removeDuplicates } from "../../lib/utils/UtilsFunc";
import { SearchAnimeInAlgolia } from "../../lib/algolia/algolia";
// Types
import type {
  AlgoliaDatasShape,
  AnimeShape,
  JikanApiResSearch,
  JikanApiResSearchRoot,
  PosterSearchData,
} from "../../lib/utils/types/interface";
// Icon
import { FaSearch, FaGlobe, FaAlgolia } from "react-icons/fa";
import { GlobalAppContext, SearchPosterContext } from "../../lib/context";
import toast from "react-hot-toast";

/* Interface */
interface FormInputProps {
  Submit: SubmitShape;
}
interface AnimeFoundListProps {
  animeFound: PosterSearchData[];
  reqTitle: string;
  Submit: SubmitShape;
}
interface AnimesFoundShape {
  animesFound: PosterSearchData[];
  reqTitle: string;
}
type SubmitShape = (title: string, api?: boolean) => void;

const SaveToSessionStorage = (ResultObject: AnimesFoundShape) =>
  sessionStorage.setItem("Search_Anime_Found", JSON.stringify(ResultObject));

/* Components */
const SearchPage: NextPage = () => {
  const { GlobalAnime } = useContext(GlobalAppContext);
  const animes = useRef<AnimeShape[]>(GlobalAnime);
  const [{ animesFound, reqTitle }, setResSearch] = useState<AnimesFoundShape>({
    animesFound: [],
    reqTitle: "",
  });

  useEffect(() => {
    const SessionData = sessionStorage.getItem("Search_Anime_Found");

    if (!SessionData) return;
    setResSearch(JSON.parse(SessionData));
  }, []);

  useEffect(() => {
    animes.current = GlobalAnime;
  }, [GlobalAnime]);

  const Submit = useCallback(
    async (title: string, api: boolean = false) => {
      if (typeof title !== "string" || title.length < 3) return;

      if (api) {
        // Query JikanAPI
        const JikanDataToPosterData = (JikanObj: JikanApiResSearch[]) =>
          JikanObj.map(
            ({ type, title, images, score, mal_id }): PosterSearchData => ({
              title,
              OverallScore: score,
              photoPath: removeParamsFromPhotoUrl(images.jpg.image_url),
              type,
              malId: mal_id,
            })
          );
        // Request to api
        const {
          success,
          data: { data: animesRes },
        } = await callApi<JikanApiResSearchRoot>(
          encodeURI(`https://api.jikan.moe/v4/anime?q=${title}&limit=16`)
        );

        if (!success || animesRes.length <= 0)
          return toast.error("Cannot Find Anime", {
            duration: 4500,
          }) as unknown as void;

        // Format
        const ToPosterShape = JikanDataToPosterData(animesRes);
        const ResultObject: AnimesFoundShape = {
          animesFound: ToPosterShape,
          reqTitle: title,
        };

        // Save
        SaveToSessionStorage(ResultObject);
        setResSearch(ResultObject);
        return;
      }

      const filterIt = (searchKey: string) => {
        const strEquality = (base: string) =>
          base?.includes(searchKey.toLowerCase());
        if (!animes.current) return [];
        return animes.current.filter((obj) => {
          const {
            title_english: te,
            title_japanese: tj,
            title_synonyms,
          } = { ...obj?.AlternativeTitle };
          const StrTs =
            title_synonyms && [...title_synonyms]?.join(" ").toLowerCase();
          return (
            strEquality(obj?.title?.toLowerCase()) ||
            (te && strEquality(te?.toLowerCase())) ||
            (tj && strEquality(tj?.toLowerCase())) ||
            (StrTs && strEquality(StrTs))
          );
        });
      };

      let resultAnimesFound: PosterSearchData[] = [];
      // Query Algolia
      const resAlgolia = await SearchAnimeInAlgolia(title);
      if (resAlgolia?.success && resAlgolia?.data && resAlgolia.data.length > 0)
        resultAnimesFound = AnimeShapeToPosterData(resAlgolia.data);
      // Query Internal (Very Few Cases, i.e: Algolia Quota Exceeded)
      else
        resultAnimesFound = AnimeShapeToPosterData(
          removeDuplicates(filterIt(title)) as unknown as AlgoliaDatasShape[]
        );

      const ResultObject: AnimesFoundShape = {
        animesFound: resultAnimesFound,
        reqTitle: title,
      };

      // Save
      SaveToSessionStorage(ResultObject);
      setResSearch(ResultObject);
    },
    [animes]
  );

  return (
    <main className="mt-3 py-2 px-2">
      <MetaTags
        title="🪐 World Anime"
        description="Find the data anime that you wanted"
      />
      <FormInput Submit={Submit} />
      <AnimeFoundList
        animeFound={animesFound}
        reqTitle={reqTitle}
        Submit={Submit}
      />
    </main>
  );
};

function FormInput({ Submit }: FormInputProps) {
  const [title, setTitle] = useState("");
  const SearchInputRef = useRef<any>();

  useEffect(() => SearchInputRef && SearchInputRef.current.focus(), []);
  useEffect(() => {
    checkWritting(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkWritting = useCallback(
    debounce(
      (titleArgs: string) =>
        titleArgs.trim().length >= 3 && Submit(titleArgs.trim().toLowerCase()),
      600
    ),
    []
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        Submit(title.trim().toLowerCase(), true);
      }}
      className="text-center"
    >
      <h1 className="text-headline mb-2 text-4xl font-bold tracking-wider sm:text-5xl">
        <FaSearch className="icon" /> Find your{" "}
        <span className="text-primary-darker">anime</span>
      </h1>
      <input
        type="text"
        data-testid="SearchAnimeInput"
        ref={SearchInputRef}
        placeholder="Bungo Stray Dogs"
        className="bg-bgi-darker text-headline focus:ring-primary-whiter h-16 w-11/12 rounded-md px-2 text-center text-2xl font-semibold outline-none transition focus:ring-2 xl:w-2/3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p className="text-description font-semibold tracking-wide">
        <span className="text-base">
          Powered by{" "}
          <a
            href="https://www.algolia.com/"
            className="text-primary-whitest font-semibold"
            target="_blank"
            rel="noreferrer"
          >
            <FaAlgolia className="icon" /> Algolia
          </a>{" "}
          {"//"}
        </span>{" "}
        <span
          onClick={() => Submit(title.trim().toLowerCase(), true)}
          data-testid="GlobalSearchBtn"
          className="text-primary-whiter hover:text-primary-main cursor-pointer text-lg transition hover:underline"
        >
          Chercher Globalement <FaGlobe className="icon text-thirdly" />
        </span>
      </p>
      <Divider />
    </form>
  );
}

function AnimeFoundList({ animeFound, reqTitle, Submit }: AnimeFoundListProps) {
  return (
    <div>
      {reqTitle && (
        <h1 className="text-headline mt-4 text-2xl font-semibold">
          Résultats pour{" "}
          <span data-testid="ResultFoundTitle" className="text-primary-main">
            &quot;{reqTitle}&quot;
          </span>{" "}
          (<span data-testid="ResultFoundNumber">{animeFound?.length}</span>)
          {animeFound?.length > 0 || (
            <p
              onClick={() => Submit(reqTitle.trim().toLowerCase(), true)}
              className="text-primary-whiter hover:text-primary-main cursor-pointer text-lg transition hover:underline"
            >
              Chercher Globalement <FaGlobe className="icon text-thirdly" />
            </p>
          )}
        </h1>
      )}
      {animeFound && (
        <div
          data-testid="SearchAnimesFoundList"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7"
        >
          <SearchPosterContext.Provider value={{ reqTitle }}>
            <AnimePoster AnimeToTransform={animeFound} />
          </SearchPosterContext.Provider>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
