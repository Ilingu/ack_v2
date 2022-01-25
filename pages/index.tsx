import { NextPage } from "next";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
// UI
import MetaTags from "../components/Common/Metatags";
import HomePoster from "../components/Home/HomePoster";

// V4: Search Mode + Check Notif

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
