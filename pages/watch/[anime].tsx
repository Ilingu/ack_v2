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
// Func
import { ToggleFav } from "../../lib/utilityfunc";
// Types
import { AnimeShape, UserAnimeShape } from "../../lib/types/interface";
// UI
import AnimesWatchType from "../../components/Common/AnimesWatchType";
import EpsPoster from "../../components/Lists/EpisodesWatchList";
import Link from "next/link";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaBell } from "react-icons/fa";

/* COMPONENT */
const WatchPage: NextPage = () => {
  const { query } = useRouter();
  const { GlobalAnime, UserAnimes } = useContext(GlobalAppContext);
  const [CurrentAnimeData, setCurrentAnimeData] = useState<AnimeShape>(null);
  const [UserAnimeData, setUserAnimeData] = useState<UserAnimeShape>(null);

  const { title, photoPath, malId, WatchType, Fav, EpisodesData, duration } =
    { ...CurrentAnimeData, ...UserAnimeData } || {};

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
      {CurrentAnimeData && UserAnimes && (
        <main>
          <MetaTags title={`Watch ${title}`} description="User Watch Page" />{" "}
          {/* Banner */}
          <div className="w-full h-80 absolute -z-10 bg-gradient-to-t from-bgi-darker">
            <Image
              src={photoPath.split(".jpg")[0] + "l.jpg"}
              alt={`${title}'s Banner`}
              layout="fill"
              className="object-cover -z-10 blur-sm bg-fixed bg-center bg-cover min-h-72 bg-no-repeat opacity-80"
            />
          </div>
          <div className="flex justify-center">
            <div className="watch-container sm:w-10/12 mt-24">
              {/* Img */}
              <div className="gta-img lg:block lg:justify-end flex justify-center">
                <Link href={`/anime/${malId}`} passHref>
                  <a>
                    <img
                      src={photoPath}
                      alt={`${title}'s Poster`}
                      width={200}
                      className="object-cover rounded-lg"
                    />
                  </a>
                </Link>
              </div>
              {/* Title */}
              <div className="gta-title lg:block lg:justify-start flex justify-center">
                <h1 className="xs:text-6xl text-5xl text-headline font-extrabold tracking-wider h-full">
                  {title.slice(0, 20)}
                  <br />
                  {title.slice(20)}
                </h1>
              </div>
              {/* Buttons */}
              <div className="gta-buttons flex flex-wrap justify-center lg:-mt-20">
                <button className="shadow-md shadow-primary-darker bg-primary-main w-14 h-14 rounded-md mr-4 text-headline text-xl outline-none">
                  <FaBell className="icon" />
                </button>
                <button
                  onClick={() =>
                    UserAnimeData && ToggleFav(malId.toString(), Fav)
                  }
                  className="shadow-md xs:mb-0 mb-2 shadow-primary-darker bg-primary-main w-14 h-14 rounded-md mr-4 text-headline text-xl outline-none"
                >
                  {Fav ? (
                    <AiFillStar className="icon" />
                  ) : (
                    <AiOutlineStar className="icon" />
                  )}
                </button>
                <AnimesWatchType
                  AnimeType={WatchType}
                  malId={malId}
                  classNameProps="h-14 w-72"
                />
              </div>
              {/* Anime Content (Progress...) */}
              <div className="gta-content">
                <EpsPoster
                  EpisodesData={EpisodesData}
                  UserAnimeData={UserAnimeData}
                  Duration={parseInt(duration.split(" ")[0])}
                />
              </div>
            </div>
          </div>
        </main>
      )}
    </AuthCheck>
  );
};

export default WatchPage;