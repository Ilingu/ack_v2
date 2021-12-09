import { FC } from "react";
import AuthCheck from "../components/AuthCheck";
import { GetStaticProps } from "next";
// UI
import MetaTags from "../components/Metatags";
// Types
import { AnimeShape } from "../lib/types/interface";

/* Interface */
interface HomeProps {
  myAnime: AnimeShape; // To Change, just here for placeholder
}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
  // Fetch From FB

  return {
    props: { myAnime: null },
    revalidate: 60,
  };
};

/* Components */
const Home: FC<HomeProps> = ({ myAnime }) => {
  // Rehydrate With Realtime

  return (
    <AuthCheck>
      <main>
        <MetaTags description="Home Page, Your anime list" />
      </main>
    </AuthCheck>
  );
};

export default Home;
