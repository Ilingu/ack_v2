import React, { FC } from "react";
import { GetServerSideProps } from "next";
// FB
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../../lib/firebase";
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
  anime: AnimeShape;
}

/* SSR */
export const getStaticProps: GetServerSideProps = async () => {
  let anime = null;
  const animesRef = doc(db, "animes");
  const AnimesSnap = await getDoc(animesRef);

  if (AnimesSnap.exists()) anime = AnimesSnap.data();
  return {
    props: { anime },
  };
};

/* Components */
const SearchPage: FC<SearchPageProps> = ({ anime }) => {
  console.log(anime);
  return <div></div>;
};

export default SearchPage;
