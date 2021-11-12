import React, { FC } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
// Anime Info Result From Search -> OneAnim on V1
// BTN add
// If anime don't existe, -> API call -> put data on "/anime" FB

/* Interface */
interface AnimeInfoProps {}

/* SSG */
export const getStaticProps: GetStaticProps = async () => {
  // Router
  // Get anime from firebase

  return {
    props: { anime: null },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all anime name from DB
  return {
    paths: null,
    fallback: "blocking",
  };
};

/* Components */
const AnimeInfo: FC<AnimeInfoProps> = ({}) => {
  return <div></div>;
};

export default AnimeInfo;
