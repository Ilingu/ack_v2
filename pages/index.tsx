import { NextPage } from "next";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
// UI
import MetaTags from "../components/Common/Metatags";
import HomePoster from "../components/Home/HomePoster";

/* V5: More scalable DB
  - API endpoint for GetAnimeData and Add To /anime FB
  - Not fetch all Global Anime but only the one User have in his List
  - In /anime (search) -> Search first in Global anime already query (so the user anime) and after
    get from the DB --> 
        So add a field that map `title --> malId` OR obj { title, alternativeTitle, malId } in "animes-config"
  - Settings Page
  
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
