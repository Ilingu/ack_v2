import { FC } from "react";
import AuthCheck from "../components/AuthCheck";
// UI
import MetaTags from "../components/Metatags";

/* Components */
const Home: FC = () => {
  return (
    <AuthCheck>
      <main>
        <MetaTags description="Home Page, Your anime list" />
      </main>
    </AuthCheck>
  );
};

export default Home;
