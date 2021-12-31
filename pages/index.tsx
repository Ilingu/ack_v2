import { NextPage } from "next";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
// UI
import MetaTags from "../components/Common/Metatags";
import HomePoster from "../components/Poster/HomePoster";

/* Components */
const Home: NextPage = () => {
  return (
    <AuthCheck>
      <main>
        <MetaTags
          title="Anim-Checker"
          description="Home Page, Your anime list"
        />
        <HomePoster />
      </main>
    </AuthCheck>
  );
};

export default Home;
