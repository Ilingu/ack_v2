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
      ({ AnimeId }) => AnimeId?.toString() === query.anime
    );
    const CurrentAnimeData = GlobalAnime.find(
      ({ malId }) => malId?.toString() === query.anime
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
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-headline text-semibold text-4xl">
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
            className="from-bgi-darker absolute -z-10 h-80 w-full bg-gradient-to-t bg-cover bg-fixed bg-center bg-no-repeat object-cover opacity-80 blur-sm"
            style={{
              backgroundImage: `url("${photoPath.split(".jpg")[0] + "l.jpg"}")`,
            }}
          ></div>
          <div className="flex justify-center">
            <div className="watch-container mt-24 px-2 sm:w-10/12 sm:px-0">
              {/* Img */}
              <div className="gta-img relative flex justify-center lg:block lg:justify-end">
                <Link href={`/anime/${malId}`} passHref>
                  <a>
                    <Image
                      src={photoPath}
                      alt={`${title}'s Poster`}
                      width={200}
                      height={283}
                      className="rounded-lg object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNcwfC/HgAFJwIozPyfrQAAAABJRU5ErkJggg=="
                      onError={() => {
                        console.warn("Img Cannot be load");
                        // GetAnimeData(malId.toString(), true);
                      }}
                    />
                    {!!NewEpisodeAvailable && (
                      <div className="text-headline bg-primary-darker  absolute top-0 rounded-md px-3 py-1 text-lg font-bold tracking-wide">
                        NEW
                      </div>
                    )}
                  </a>
                </Link>
              </div>
              {/* Title */}
              <div className="gta-title flex justify-center lg:block lg:justify-start">
                <h1
                  id="WatchBigTitle"
                  className={`xs:text-6xl text-5xl ${
                    !!NewEpisodeAvailable ? "text-indigo-50" : "text-headline"
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
                  className="shadow-primary-darker bg-primary-main text-headline h-14 w-14 rounded-md text-xl shadow-md outline-none"
                >
                  <FaPlay className="icon" />
                </button>
                <button
                  onClick={() =>
                    UserAnimeData && ToggleFav(malId.toString(), Fav)
                  }
                  className="xs:mb-0 shadow-primary-darker bg-primary-main text-headline mb-2 h-14 w-14 rounded-md text-xl shadow-md outline-none"
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
