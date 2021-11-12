import { FC } from "react";
import AuthCheck from "../components/AuthCheck";
// UI
import MetaTags from "../components/Metatags";

/* Components */
const Home: FC = () => {
  return (
    <AuthCheck>
      <div>
        <MetaTags description="Home Page, Your anime list" />
      </div>
    </AuthCheck>
  );
};

export default Home;
