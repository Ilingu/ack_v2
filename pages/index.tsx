import AuthCheck from "../components/Common/AuthCheck";
import { GetStaticProps, NextPage } from "next";
// UI
import MetaTags from "../components/Common/Metatags";
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
const Home: NextPage<HomeProps> = ({ myAnime }) => {
  // Rehydrate With Realtime

  return (
    <AuthCheck>
      <main>
        <MetaTags
          title="Anim-Checker"
          description="Home Page, Your anime list"
        />
      </main>
    </AuthCheck>
  );
};

export default Home;
