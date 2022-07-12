import { NextPage } from "next";
// Auth
import AuthCheck from "../components/Services/AuthCheck";
// UI
import MetaTags from "../components/Services/Metatags";
import HomePoster from "../components/pages/Home/HomePoster";

/* Components */
const Home: NextPage = () => {
  return (
    <AuthCheck
      PageMetaData={["Home-Please Connect", "Home Page - Please Connect"]}
    >
      <main data-testid="Home-Page-Main">
        <MetaTags />
        <HomePoster />
      </main>
    </AuthCheck>
  );
};

export default Home;
