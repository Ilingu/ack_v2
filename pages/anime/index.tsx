import React, { FC, Fragment, useCallback, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import debounce from "lodash.debounce";
// UI
import Divider from "../../components/Divider";
// FB
import { collection, getDocs } from "@firebase/firestore";
import { db, postToJSON, removeDuplicates } from "../../lib/firebase";
// Types
import { AnimeShape } from "../../lib/types/interface";
import MetaTags from "../../components/Metatags";
// Icon
import { FaSearch } from "react-icons/fa";

// Form to search Anime (also the page for add an anime)
// Btn add (pre-result)
// Search -> query from anime props (SSR), decompose sentence into words, and search also for the all sentence
// If no result or no user pertinent choice: API
// If user click on API request made anime -> /Search/$anime_name?is_api=true
// -> like that [anime].tsx will go faster in GetStaticProps

/* Interface */
interface SearchPageProps {
  animes: AnimeShape[];
}

/* SSR */
export const getServerSideProps: GetServerSideProps = async () => {
  const animesRef = collection(db, "animes");
  const animes = (await getDocs(animesRef))?.docs?.map(postToJSON) || [];

  return {
    props: {
      animes,
    },
  };
};

/* Components */
const SearchPage: FC<SearchPageProps> = ({ animes }) => {
  const Submit = useCallback(
    (title: string) => {
      if (typeof title !== "string") return;
      const keyWords = title.split(" ");

      const filterIt = (searchKey: string) => {
        const strEquality = (base: string) =>
          base.includes(searchKey.toLowerCase());
        return animes.filter((obj) => {
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

      const resultAllAnime = removeDuplicates(filterIt(title));
      let resultKeyWord: AnimeShape[] = []; // Result by keyWord is useless because of .includes -> To remove
      keyWords.forEach((keyword) => {
        resultKeyWord = [
          ...resultKeyWord,
          ...filterIt(keyword),
        ] as AnimeShape[];
      });
      resultKeyWord = removeDuplicates(resultKeyWord);

      console.log(resultAllAnime, resultKeyWord);
    },
    [animes]
  );

  return (
    <Fragment>
      <MetaTags
        title="🪐 World Anime"
        description="Find the data anime that you wanted"
      />
      <main className="h-screen py-2 px-2 grid grid-rows-12">
        <FormInput Submit={Submit} />
        <Result />
      </main>
    </Fragment>
  );
};

function FormInput({ Submit }) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    checkWritting(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkWritting = useCallback(
    debounce(
      (titleArgs: string) =>
        titleArgs.trim().length >= 2 && Submit(titleArgs.trim().toLowerCase()),
      600
    ),
    []
  );

  return (
    <form
      onSubmit={Submit}
      className="flex flex-col justify-evenly items-center row-span-3"
    >
      <h1 className="tracking-wider text-5xl font-bold text-gray-50 mb-6">
        <FaSearch className="inline" /> Find your{" "}
        <span className="text-primary">anime</span>
      </h1>
      <input
        type="text"
        placeholder="Bungo Stray Dogs"
        className="w-2/3 bg-gray-900 h-16 rounded-md text-center text-2xl text-gray-50 font-semibold px-2 outline-none 
        focus:ring-2 focus:ring-offset-2 focus:ring-white transition"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Divider />
    </form>
  );
}

function Result() {
  return <div className="row-span-9"></div>;
}

export default SearchPage;
