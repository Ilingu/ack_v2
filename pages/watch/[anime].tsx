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
import { ConvertBroadcastTimeZone, ToggleFav } from "../../lib/utils/UtilsFunc";
// Types
import { AnimeShape, UserAnimeShape } from "../../lib/utils/types/interface";
// UI
import AnimesWatchType from "../../components/Common/AnimesWatchType";
import EpsPoster from "../../components/WatchComponents/EpisodesWatchList";
import Link from "next/link";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaPlay, FaSpinner } from "react-icons/fa";
import MovieList from "../../components/WatchComponents/MovieList";
import FocusModeComponent from "../../components/WatchComponents/FocusMode";
import MovieFocusMode from "../../components/WatchComponents/MovieFocusMode";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

/* Func */
const AddNextEpisodeReleaseDate = async (
  NextReleaseDate: number,
  AnimeId: string
) => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      AnimeId
    );

    await updateDoc(AnimeRef, {
      NextEpisodeReleaseDate: NextReleaseDate,
    });
  } catch (err) {}
};

const NewEpReleased = async (AnimeId: string) => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      AnimeId
    );

    await updateDoc(AnimeRef, {
      NewEpisodeAvailable: true,
    });
  } catch (err) {}
};

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
    broadcast,
    Airing,
    NextEpisodeReleaseDate,
    NewEpisodeAvailable,
  } = { ...CurrentAnimeData, ...UserAnimeData } || {};

  useEffect(() => {
    if (!GlobalAnime || !UserAnimes) return;

    const UserAnimeData = UserAnimes.find(
      ({ AnimeId }) => AnimeId.toString() === query.anime
    );
    const CurrentAnimeData = GlobalAnime.find(
      ({ malId }) => malId.toString() === query.anime
    );

    if (!UserAnimeData) push("/404");

    setCurrentAnimeData(CurrentAnimeData);
    setUserAnimeData(UserAnimeData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GlobalAnime, UserAnimes, query]);

  useEffect(() => {
    /* NOTIF */
    if (!NextEpisodeReleaseDate) AddNextEpisodeReleaseDateToFB();
    if (NextEpisodeReleaseDate && Date.now() >= NextEpisodeReleaseDate) {
      !NewEpisodeAvailable && NewEpReleased(CurrentAnimeData.malId.toString());
      AddNextEpisodeReleaseDateToFB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [NextEpisodeReleaseDate]);

  const AddNextEpisodeReleaseDateToFB = () => {
    if (!broadcast || !Airing) return;

    const BroadcastTime = ConvertBroadcastTimeZone(
      broadcast,
      "NextBroadcastNumber"
    ) as number;
    AddNextEpisodeReleaseDate(BroadcastTime, CurrentAnimeData.malId.toString());
  };

  if (!UserAnimeData)
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-headline text-4xl text-semibold">
          <FaSpinner className="icon" /> Load...
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
            className="w-full h-80 absolute -z-10 bg-fixed bg-center bg-cover bg-no-repeat bg-gradient-to-t from-bgi-darker object-cover blur-sm opacity-80"
            style={{
              backgroundImage: `url("${photoPath.split(".jpg")[0] + "l.jpg"}")`,
            }}
          ></div>
          <div className="flex justify-center">
            <div className="watch-container sm:w-10/12 sm:px-0 px-2 mt-24">
              {/* Img */}
              <div className="gta-img lg:block lg:justify-end flex justify-center relative">
                <Link href={`/anime/${malId}`} passHref>
                  <a>
                    <Image
                      src={photoPath}
                      alt={`${title}'s Poster`}
                      width={200}
                      height={283}
                      className="object-cover rounded-lg"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNcwfC/HgAFJwIozPyfrQAAAABJRU5ErkJggg=="
                      onError={() => {
                        console.warn("Img Cannot be load");
                        // GetAnimeData(malId.toString(), true);
                      }}
                    />
                    {!!NewEpisodeAvailable && (
                      <div className="absolute top-0  tracking-wide text-lg font-bold text-headline bg-primary-darker px-3 py-1 rounded-md">
                        NEW
                      </div>
                    )}
                  </a>
                </Link>
              </div>
              {/* Title */}
              <div className="gta-title lg:block lg:justify-start flex justify-center">
                <h1
                  id="WatchBigTitle"
                  className={`xs:text-6xl text-5xl ${
                    !!NewEpisodeAvailable ? "text-indigo-50" : "text-headline"
                  } font-extrabold tracking-wider h-full`}
                >
                  {title.slice(0, 20)}
                  <br />
                  {title.slice(20)}
                </h1>
              </div>
              {/* Buttons */}
              <div className="gta-buttons flex flex-wrap gap-x-4 gap-y-2 2xl:-ml-20 lg:ml-20 justify-center lg:-mt-20">
                <button
                  onClick={() => setFocusMode(true)}
                  className="shadow-md shadow-primary-darker bg-primary-main w-14 h-14 rounded-md text-headline text-xl outline-none"
                >
                  <FaPlay className="icon" />
                </button>
                <button
                  onClick={() =>
                    UserAnimeData && ToggleFav(malId.toString(), Fav)
                  }
                  className="shadow-md xs:mb-0 mb-2 shadow-primary-darker bg-primary-main w-14 h-14 rounded-md text-headline text-xl outline-none"
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
              {/* Anime Content/Focus Mode */}

              <div className="gta-content">
                {type === "Movie" || type === "Music" ? (
                  <MovieList Duration={duration.replace("hr", "Hr")} />
                ) : (
                  <EpsPoster
                    EpisodesData={EpisodesData}
                    UserAnimeData={UserAnimeData}
                    Duration={parseInt(duration.split(" ")[0])}
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
