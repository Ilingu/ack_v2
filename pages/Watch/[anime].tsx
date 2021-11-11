import React, { FC } from "react";
import { GetStaticProps, GetServerSideProps } from "next";

/* Interface */
interface AnimeProps {}

/* SSG */

export const getStaticProps: GetStaticProps = async () => {
  // Router
  // Get anime from firebase

  return {
    props: {
      anime: null,
    },
  };
};

/* SSR */

export const getServerSideProps: GetServerSideProps = async () => {
  // Get user anime progress

  return {
    props: {
      anime: null,
    },
  };
};

const WatchAnime: FC<AnimeProps> = ({}) => {
  // Get user anime progress -> SSR then Rehydrate with Realtime
  return <div></div>;
};

export default WatchAnime;
