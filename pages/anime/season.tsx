import React, { FC } from "react";
import { GetStaticProps } from "next";

/* Interface */
interface SeasonAnimeProps {}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
  // Page for the season anime -> fetch from API
  // With params: ?season= ?year=

  return {
    props: { anime: null },
    revalidate: 10000,
  };
};

/* Components */
const SeasonAnime: FC<SeasonAnimeProps> = ({}) => {
  return <div></div>;
};

export default SeasonAnime;
