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
import AnimePoster from "../../components/Poster/SearchPoster";
// Utility Func
import {
  callApi,
  removeDuplicates,
  removeParamsFromPhotoUrl,
} from "../../lib/utilityfunc";
// Types
import {
  AnimeShape,
  JikanApiResSearch,
  JikanApiResSearchRoot,
  PosterSearchData,
} from "../../lib/types/interface";
// Icon
import { FaSearch, FaGlobe } from "react-icons/fa";
import { GlobalAppContext, SearchPosterContext } from "../../lib/context";

/* Interface */
interface FormInputProps {
  Submit: SubmitShape;
}
interface AnimeFoundListProps {
  animeFound: PosterSearchData[];
  reqTitle: string;
  Submit: SubmitShape;
}
type SubmitShape = (title: string, api?: boolean) => void;

/* Components */
const SearchPage: NextPage = () => {
  const { GlobalAnime } = useContext(GlobalAppContext);
  const animes = useRef<AnimeShape[]>(GlobalAnime);
  const [{ animesFound, reqTitle }, setResSearch] = useState<{
    animesFound: PosterSearchData[];
    reqTitle: string;
  }>({ animesFound: [], reqTitle: "" });

  useEffect(() => {
    animes.current = GlobalAnime;
  }, [GlobalAnime]);

  const Submit = useCallback(
    async (title: string, api: boolean = false) => {
      if (typeof title !== "string" || title.length < 3) return;

      if (api) {
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
        const { data: animesRes }: JikanApiResSearchRoot = await callApi(
          `https://api.jikan.moe/v4/anime?q=${title}&limit=16`
        );
        const ToPosterShape = JikanDataToPosterData(animesRes);
        setResSearch({ animesFound: ToPosterShape, reqTitle: title });
        return;
      }

      const AnimeShapeToPosterData = (JikanObj: AnimeShape[]) =>
        JikanObj.map(
          ({
            type,
            title,
            photoPath,
            OverallScore,
            malId,
          }): PosterSearchData => ({
            title,
            OverallScore,
            photoPath: removeParamsFromPhotoUrl(photoPath),
            type,
            malId,
          })
        );

      const filterIt = (searchKey: string) => {
        const strEquality = (base: string) =>
          base.includes(searchKey.toLowerCase());
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

      const resultAnimesFound = AnimeShapeToPosterData(
        removeDuplicates(filterIt(title))
      );
      setResSearch({ animesFound: resultAnimesFound, reqTitle: title });
    },
    [animes]
  );

  return (
    <main className="h-screen py-2 px-2 grid grid-rows-12">
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
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col justify-evenly items-center row-span-3"
    >
      <h1 className="tracking-wider text-5xl font-bold text-headline">
        <FaSearch className="icon" /> Find your{" "}
        <span className="text-primary-darker">anime</span>
      </h1>
      <input
        type="text"
        placeholder="Bungo Stray Dogs"
        className="w-2/3 bg-bgi-darker h-16 rounded-md text-center text-2xl text-headline font-semibold px-2 outline-none 
        focus:ring-2 focus:ring-primary-whiter transition"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p className="text-description font-semibold tracking-wide">
        <span className="text-base">Aucun résultats pertinent ?</span>{" "}
        <span
          onClick={() => Submit(title, true)}
          className="text-lg text-primary-whiter hover:underline hover:text-primary-main cursor-pointer transition"
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
    <div className="row-span-9">
      {reqTitle && (
        <h1 className="text-2xl font-semibold text-headline">
          Résultats pour{" "}
          <span className="text-primary-main">&quot;{reqTitle}&quot;</span> (
          {animeFound?.length})
          {animeFound?.length > 0 || (
            <p
              onClick={() => Submit(reqTitle, true)}
              className="text-lg text-primary-whiter hover:underline hover:text-primary-main cursor-pointer transition"
            >
              Chercher Globalement <FaGlobe className="icon text-thirdly" />
            </p>
          )}
        </h1>
      )}
      {animeFound && (
        <div className="grid grid-cols-7 gap-2">
          <SearchPosterContext.Provider value={{ reqTitle }}>
            <AnimePoster AnimeToTransform={animeFound} />
          </SearchPosterContext.Provider>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
