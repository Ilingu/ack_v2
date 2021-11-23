import React, { FC } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
// Anime Info Result From Search -> OneAnim on V1
// If anime don't existe, -> API call -> put data on "/anime" FB

/* Interface */
interface AnimeInfoProps {}

/* SSG */
export const getStaticProps: GetStaticProps = async () => {
  // Router
  // Get anime from firebase OR API
  // If anime does not exist nor in db nor in API -> 404
  // If /anime_name?is_api=true -> get anime directly on API because index.tsx already know that anime doesn't exist

  return {
    props: { anime: null },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all anime name from DB
  return {
    paths: null,
    fallback: true, // If anime isn't cache in DB yet
  };
};

/* Components */
const AnimeInfo: FC<AnimeInfoProps> = ({}) => {
  const router = useRouter();

  // If the page cacheless is not yet generated, this will be displayed
  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return <div></div>;
};

export default AnimeInfo;
