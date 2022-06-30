import { NextPage } from "next";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
// UI
import MetaTags from "../components/Common/Metatags";
import HomePoster from "../components/Home/HomePoster";

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
