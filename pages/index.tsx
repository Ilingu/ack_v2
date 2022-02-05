import { NextPage } from "next";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
// UI
import MetaTags from "../components/Common/Metatags";
import HomePoster from "../components/Home/HomePoster";

/* V5: More scalable DB
  - Not fetch all Global Anime but only the one User have in his List
  - In /anime (search page) -> Search first in Global anime already queried (so the user anime) and after
    get from the DB --> 
        add a field "search-query": Array obj { malId, title, title_english, title_jap }[] in "animes-config"
        query with FB query module (see doc/project firebase)
*/

/* Components */
const Home: NextPage = () => {
  return (
    <AuthCheck
      PageMetaData={["Home-Please Connect", "Home Page - Please Connect"]}
    >
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
