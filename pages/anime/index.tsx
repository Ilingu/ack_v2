import React, { FC } from "react";
import { GetServerSideProps } from "next";
// FB
import { collection, getDocs } from "@firebase/firestore";
import { db, postToJSON } from "../../lib/firebase";
// Types
import { AnimeShape } from "../../lib/types/interface";

// Form to search Anime (also the page for add an anime)
// Btn add (pre-result)
// Search -> query from anime props (SSR), decompose sentence into words, and search also for the all sentence
// If no result or no user pertinent choice: API
// If user click on API request made anime -> /Search/$anime_name?is_api=true
// -> like that [anime].tsx will go faster in GetStaticProps

/* Interface */
interface SearchPageProps {
  animes: AnimeShape;
}

/* SSR */
export const getServerSideProps: GetServerSideProps = async () => {
  const animesRef = collection(db, "animes");
  const animes = (await getDocs(animesRef))?.docs?.map(postToJSON) || [];

  return {
    props: { animes },
  };
};

/* Components */
const SearchPage: FC<SearchPageProps> = ({ animes }) => {
  console.log(animes);
  return <div></div>;
};

export default SearchPage;
