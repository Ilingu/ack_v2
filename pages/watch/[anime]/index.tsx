import React, { Fragment, useContext, useState } from "react";
import { NextPage } from "next";
// Auth
import AuthCheck from "../../../components/Common/AuthCheck";
import MetaTags from "../../../components/Common/Metatags";
// Ctx
import { GlobalAppContext } from "../../../lib/context";
// Type
import { UserAnimeShape } from "../../../lib/types/interface";

/* Components */
const WatchAnime: NextPage = () => {
  const { UserAnimes, GlobalAnime } = useContext(GlobalAppContext);
  const [CurrentAnime, setCurrentAnime] = useState<UserAnimeShape>();

  return (
    <Fragment>
      <AuthCheck>
        <main>
          <MetaTags title={""} description="" />
        </main>
      </AuthCheck>
    </Fragment>
  );
};

export default WatchAnime;
