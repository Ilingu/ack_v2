import { useContext, useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
// CTX
import { GlobalAppContext } from "../../lib/context";
// Auth
import AuthCheck from "../../components/Services/AuthCheck";
// Func
import { CheckNewEpisodeData, ToggleFav } from "../../lib/client/ClientFuncs";
// Types
import type {
  AnimeShape,
  UserAnimeShape,
} from "../../lib/utils/types/interface";
// UI
import MetaTags from "../../components/Services/Metatags";
import AnimesWatchType from "../../components/Services/AnimesWatchType";
import EpsPoster from "../../components/pages/Watch/EpisodesWatchList";
import Link from "next/link";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaPlay, FaSpinner } from "react-icons/fa";
import MovieList from "../../components/pages/Watch/MovieList";
import FocusModeComponent from "../../components/pages/Watch/FocusMode";
import MovieFocusMode from "../../components/pages/Watch/MovieFocusMode";

/* Func */

/* COMPONENT */
const WatchPage: NextPage = () => {
  const { query, push } = useRouter();

  const { GlobalAnime, UserAnimes } = useContext(GlobalAppContext);
  const [CurrentAnimeData, setCurrentAnimeData] = useState<AnimeShape>(null);
  const [UserAnimeData, setUserAnimeData] = useState<UserAnimeShape>(null);

  const [FocusMode, setFocusMode] = useState(false);

  const {
    title,
    photoPath,
    malId,
    WatchType,
    Fav,
    EpisodesData,
    duration,
    type,
    ProvidersLink,
    NewEpisodeAvailable,
    NextEpisodesReleaseDate,
    broadcast,
    Airing,
  } = { ...CurrentAnimeData, ...UserAnimeData } || {};

  useEffect(() => {
    if (!GlobalAnime || !UserAnimes) return;

    const UserAnimeData = UserAnimes.find(
      ({ AnimeId }) => AnimeId?.toString() === query.anime
    );
    const CurrentAnimeData = GlobalAnime.find(
      ({ malId }) => malId?.toString() === query.anime
    );

    if (!UserAnimeData || !CurrentAnimeData) push(`/anime/${query.anime}`);

    setCurrentAnimeData(CurrentAnimeData);
    setUserAnimeData(UserAnimeData);

    // Check NewEp
    if (CurrentAnimeData?.Airing && !UserAnimeData?.NewEpisodeAvailable)
      CheckNewEpisodeData(
        CurrentAnimeData?.NextEpisodesReleaseDate,
        UserAnimeData?.Progress,
        query.anime.toString()
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GlobalAnime, UserAnimes, query]);

  if (!UserAnimeData || !CurrentAnimeData)
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-semibold text-4xl text-headline">
          <FaSpinner className="icon" /> Loading...
        </h1>
      </div>
    );

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
          <div
            className="absolute -z-10 h-80 w-full bg-gradient-to-t from-bgi-darker bg-cover bg-fixed bg-center bg-no-repeat object-cover opacity-80 blur-sm"
            data-testid="WatchBanner"
            style={{
              backgroundImage: `url("${photoPath.split(".jpg")[0] + "l.jpg"}")`,
            }}
          ></div>
          <div className="flex justify-center">
            <div className="watch-container mt-24 px-2 sm:w-10/12 sm:px-0">
              {/* Img */}
              <div className="gta-img relative">
                <Link href={`/anime/${malId}`} passHref>
                  <a>
                    <Image
                      src={photoPath}
                      alt={`${title}'s Poster`}
                      width={200}
                      height={283}
                      className="rounded-lg object-cover"
                      placeholder="blur"
                      data-testid="WatchImgPoster"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNcwfC/HgAFJwIozPyfrQAAAABJRU5ErkJggg=="
                    />
                    {NewEpisodeAvailable && (
                      <div className="absolute top-0  rounded-md bg-primary-darker px-3 py-1 text-lg font-bold tracking-wide text-headline">
                        NEW
                      </div>
                    )}
                  </a>
                </Link>
              </div>
              {/* Title */}
              <div className="gta-title">
                <h1
                  id="WatchBigTitle"
                  className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${
                    NewEpisodeAvailable ? "text-indigo-50" : "text-headline"
                  } h-full font-extrabold tracking-wider`}
                >
                  {title.slice(0, 20)}
                  <br />
                  {title.slice(20)}
                </h1>
              </div>
              {/* Buttons */}
              <div className="gta-buttons flex flex-wrap justify-center gap-x-4 gap-y-2 lg:ml-20 lg:-mt-20 2xl:-ml-20">
                <button
                  onClick={() => setFocusMode(true)}
                  data-testid="WatchActivateFocusModeBtn"
                  className="h-14 w-14 rounded-md bg-primary-main text-xl text-headline shadow-md shadow-primary-darker 
                  outline-none"
                >
                  <FaPlay className="icon" />
                </button>
                <button
                  onClick={() =>
                    UserAnimeData && ToggleFav(malId.toString(), Fav)
                  }
                  className="mb-2 h-14 w-14 rounded-md bg-primary-main text-xl text-headline shadow-md shadow-primary-darker 
                  outline-none xs:mb-0"
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

              {/* Anime Content */}
              <div className="gta-content">
                {type === "Movie" || type === "Music" ? (
                  <MovieList Duration={duration.replace("hr", "Hr")} />
                ) : (
                  <EpsPoster
                    EpisodesData={EpisodesData}
                    UserAnimeData={UserAnimeData}
                    ExtraInfo={{
                      ProvidersLink,
                      NextEpisodesReleaseDate,
                      Duration: parseInt(duration.split(" ")[0]),
                      broadcast: Airing && (broadcast || null),
                    }}
                    setFocusMode={setFocusMode}
                  />
                )}
              </div>
            </div>
          </div>
          {FocusMode && type !== "Movie" && (
            <FocusModeComponent
              EpisodesData={EpisodesData}
              UserAnimeData={UserAnimeData}
              CancelModeFocus={() => setFocusMode(false)}
            />
          )}
          {FocusMode && type === "Movie" && (
            <MovieFocusMode
              AnimeId={UserAnimeData?.AnimeId.toString()}
              title={title}
              duration={duration.replace("hr", "Hr")}
              CancelModeFocus={() => setFocusMode(false)}
            />
          )}
        </main>
      )}
    </AuthCheck>
  );
};

export default WatchPage;
