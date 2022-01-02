import { NextPage } from "next";
import { Fragment } from "react";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
// UI
import MetaTags from "../components/Common/Metatags";
import HomePoster from "../components/Poster/HomePoster";

/* Components */
const Home: NextPage = () => {
  return (
    <Fragment>
      <MetaTags title="Anim-Checker" description="Home Page, Your anime list" />
      <AuthCheck>
        <main>
          <HomePoster />
        </main>
      </AuthCheck>
    </Fragment>
  );
};

export default Home;
