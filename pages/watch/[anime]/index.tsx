import React from "react";
import { GetStaticProps, GetStaticPaths, NextPage } from "next";
// UI
import AuthCheck from "../../../components/Common/AuthCheck";

/* Interface */
interface AnimeProps {}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
  // Router
  // Get anime from firebase
  // Get user anime progress

  return {
    props: { anime: null },
    revalidate: 60,
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
const WatchAnime: NextPage<AnimeProps> = ({}) => {
  // Get user anime progress -> ISR then Rehydrate with Realtime
  return (
    <AuthCheck>
      <main></main>
    </AuthCheck>
  );
};

export default WatchAnime;
