import React, { Fragment, useContext, useState } from "react";
import { NextPage } from "next";
// Auth
import AuthCheck from "../../../components/Common/AuthCheck";
import MetaTags from "../../../components/Common/Metatags";
// Ctx
import { GlobalAppContext } from "../../../lib/context";
// Type
import { UserAnimeShape } from "../../../lib/types/interface";

// [TEMPLATE]: https://mangadex.org/title/cda258ad-550e-4971-b88b-b7b60093d208/i-want-to-hear-you-say-you-like-me

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
