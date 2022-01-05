/* eslint-disable @next/next/no-img-element */
import { useContext, useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
// CTX
import { GlobalAppContext } from "../../lib/context";
// Auth
import AuthCheck from "../../components/Common/AuthCheck";
import MetaTags from "../../components/Common/Metatags";
// Types
import { AnimeShape, UserAnimeShape } from "../../lib/types/interface";

// [TEMPLATE]: https://mangadex.org/title/cda258ad-550e-4971-b88b-b7b60093d208/i-want-to-hear-you-say-you-like-me

const WatchPage: NextPage = () => {
  const { query } = useRouter();
  const { GlobalAnime, UserAnimes } = useContext(GlobalAppContext);
  const [CurrentAnimeData, setCurrentAnimeData] = useState<AnimeShape>(null);
  const [UserAnimeData, setUserAnimeData] = useState<UserAnimeShape>(null);

  const { title, photoPath } = CurrentAnimeData || {};

  useEffect(() => {
    if (!GlobalAnime || !UserAnimes) return;
    const UserAnimeData = UserAnimes.find(
      ({ AnimeId }) => AnimeId.toString() === query.anime
    );
    const CurrentAnimeData = GlobalAnime.find(
      ({ malId }) => malId.toString() === query.anime
    );
    setCurrentAnimeData(CurrentAnimeData);
    setUserAnimeData(UserAnimeData);
  }, [GlobalAnime, UserAnimes, query]);

  return (
    <AuthCheck
      PageMetaData={[
        "Watch-Please connect",
        "You have to be connected to access this page",
      ]}
    >
      {CurrentAnimeData && (
        <main>
          <MetaTags title={`Watch ${title}`} description="User Watch Page" />{" "}
          {/* Banner */}
          <div className="w-screen h-80 absolute">
            <Image
              src={photoPath.split(".jpg")[0] + "l.jpg"}
              alt={`${title}'s Banner`}
              layout="fill"
              className="object-cover -z-10 blur-sm bg-fixed bg-center bg-cover min-h-72 bg-no-repeat opacity-80"
            />
          </div>
          <div className="flex justify-center">
            <div className="watch-container w-10/12  mt-24">
              {/* Img */}
              <div className="gta-img">
                <img
                  src={photoPath}
                  alt={`${title}'s Poster`}
                  width={200}
                  className="object-cover rounded-lg"
                />
              </div>
              {/* Title */}
              <div className="gta-title">
                <h1 className="text-6xl text-headline font-extrabold tracking-wider h-full">
                  {title.slice(0, 20)}
                </h1>
              </div>
              {/* Buttons (Settings:  WatchType, Notif, Fav...) */}
              <div className="gta-buttons"></div>
              {/* Anime Content (Progress...) */}
              <div className="gta-content"></div>
            </div>
          </div>
        </main>
      )}
    </AuthCheck>
  );
};

export default WatchPage;
