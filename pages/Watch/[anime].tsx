import React, { FC } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
// UI
import AuthCheck from "../../components/AuthCheck";

/* Interface */
interface AnimeProps {}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
  // Router
  // Get anime from firebase
  // Get user anime progress

  return {
    props: { anime: null },
    revalidate: 60000,
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
const WatchAnime: FC<AnimeProps> = ({}) => {
  // Get user anime progress -> ISR then Rehydrate with Realtime
  return (
    <AuthCheck>
      <div></div>
    </AuthCheck>
  );
};

export default WatchAnime;
