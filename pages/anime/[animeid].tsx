/* eslint-disable @next/next/no-img-element */
import React, {
  FC,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
// Type
import {
  AnimeShape,
  JikanApiResAnime,
  AnimeConfigPathsIdShape,
  StudiosShape,
  TagsShape,
  AlternativeTitleShape,
  JikanApiResRecommandations,
} from "../../lib/types/interface";
import { AnimeWatchType } from "../../lib/types/enums";
import {
  callApi,
  getAllTheEpisodes,
  JikanApiToAnimeShape,
  postToJSON,
} from "../../lib/utilityfunc";
// FB
import { doc, getDoc, writeBatch } from "@firebase/firestore";
import { db } from "../../lib/firebase";
// UI
import MetaTags from "../../components/Metatags";
import Loader from "../../components/Loader";
import EpisodesList from "../../components/Search/EpisodesList";
import RecommandationsList from "../../components/Search/RecommandationsList";
import {
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaInfo,
  FaStar,
  FaTv,
} from "react-icons/fa";
import { EpisodesSearchContext } from "../../lib/context";

/* Interface */
interface AnimeInfoProps {
  animeData: AnimeShape;
}
interface SpecialInfoProps {
  AgeRating: string;
  AlternativeTitle: AlternativeTitleShape;
  duration: string;
  studios: StudiosShape[];
}
interface TagsAnimesProps {
  Genres: TagsShape[];
  Themes: TagsShape[];
}

/* SSG */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { animeid: animeId } = params as { animeid: string };

  // Check on FB
  const animeFBRef = doc(db, "animes", animeId);
  const animeFB = await getDoc(animeFBRef);
  if (animeFB.exists()) {
    return {
      props: { animeData: postToJSON(animeFB) }, // Exists on FB
    };
  }

  // Does not exists on FB -> API Req
  let animeData: AnimeShape;
  try {
    const endpoint = `https://api.jikan.moe/v3/anime/${animeId}`;
    // Req
    const animeRes: JikanApiResAnime = await callApi(endpoint);
    let animeEpsRes = await getAllTheEpisodes(animeId);
    const animeRecommendationsRes: JikanApiResRecommandations = await callApi(
      endpoint + "/recommendations"
    );
    if (animeEpsRes.length <= 0) animeEpsRes = null;
    const AllAnimeData = await Promise.all([
      animeRes,
      animeEpsRes,
      animeRecommendationsRes,
    ]);

    let IsGood = true;
    AllAnimeData || (IsGood = false);
    [AllAnimeData[0], AllAnimeData[2]].forEach((oneData) => {
      if (!oneData || oneData.status === 404) IsGood = false;
    });

    if (IsGood) {
      animeData = JikanApiToAnimeShape(AllAnimeData);
      // Send To FB
      const batch = writeBatch(db);

      const newAnimesRef = doc(db, "animes", animeId);
      batch.set(newAnimesRef, animeData);

      const animesConfigPathsRef = doc(db, "animes", "animes-config");
      const animesConfigPaths = (
        await getDoc(animesConfigPathsRef)
      ).data() as AnimeConfigPathsIdShape;
      const newAnimeConfigPaths = {
        AllAnimeId: [...animesConfigPaths?.AllAnimeId, animeId],
      };
      batch.update(animesConfigPathsRef, newAnimeConfigPaths);

      await batch.commit();
    } else {
      return {
        notFound: true,
      };
    }
  } catch (err) {
    return {
      notFound: true,
    };
  }

  if (!animeData)
    return {
      notFound: true,
    };

  return {
    props: { animeData },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all anime path name from DB
  const animesPaths = (
    await getDoc(doc(db, "animes", "animes-config"))
  ).data() as AnimeConfigPathsIdShape;

  const paths = animesPaths.AllAnimeId.map((doc) => ({
    params: { animeid: doc },
  }));

  return {
    paths,
    fallback: true, // If anime isn't cache in DB yet
  };
};

/* Components */
const AnimeInfo: FC<AnimeInfoProps> = ({ animeData }) => {
  const router = useRouter();
  const {
    title,
    photoPath,
    OverallScore,
    ScoredBy,
    type,
    MalPage,
    nbEp,
    ReleaseDate,
    Airing,
    Studios,
    Synopsis,
    Genre,
    Theme,
    trailer_url,
    AgeRating,
    AlternativeTitle,
    duration,
    EpisodesData,
    Recommendations,
  } = animeData || {};
  const ScoredByTransform = useCallback((): string => {
    if (ScoredBy / 1000 >= 1) return `${(ScoredBy / 1000).toFixed(0)}K`;
    return ScoredBy.toString();
  }, [ScoredBy]);

  if (router.isFallback)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader show big />
      </div>
    );

  return (
    <Fragment>
      <MetaTags
        title={title}
        description={`${title} anime info page`}
        image={photoPath}
      />
      <div className="py-2 flex flex-col items-center">
        {/* Overall Info */}
        <section className="relative w-5/6">
          <h1 className="text-4xl font-bold text-primary-main underline">
            {title}
          </h1>
          <div className="mt-6 flex flex-col items-center">
            <div className="w-5/6">
              <div className="grid grid-cols-4 text-headline font-bold mb-6 text-2xl justify-items-center">
                <div>
                  <FaTv className="inline -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">{type}</span>{" "}
                  {type === "TV" && (
                    <span className="italic text-description text-xl">
                      ({nbEp} eps)
                    </span>
                  )}
                </div>
                <div>
                  <FaStar className="inline text-yellow-500 -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">{OverallScore}</span>{" "}
                  <span className="italic text-description text-xl">
                    ({ScoredByTransform()} people)
                  </span>
                </div>
                <div>
                  <FaCalendarAlt className="inline -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">{ReleaseDate}</span>
                  <span className="italic text-description text-xl">
                    {Airing || " (Finished)"}
                  </span>
                </div>
                <div>
                  {type === "TV" ? (
                    <Fragment>
                      <FaFilm className="inline -translate-y-0.5" />{" "}
                      <span className="text-primary-whiter">
                        <StudiosComponent studio={Studios[0]} />
                      </span>
                    </Fragment>
                  ) : (
                    <Fragment>
                      <FaClock className="inline -translate-y-0.5" />{" "}
                      <span className="text-primary-whiter">
                        {duration.toUpperCase()}
                      </span>
                    </Fragment>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-6">
                <div className="relative col-span-1">
                  <img
                    src={photoPath}
                    alt={`${title}'s cover`}
                    className="rounded-md ring-2 ring-primary-whiter shadow-md"
                  />
                  <a href={MalPage} target="_blank" rel="noreferrer">
                    <FaInfo
                      onClick={() => router.push(MalPage)}
                      className="absolute -top-3 -left-3 text-headline font-bold w-12 h-12 py-2 px-2 bg-primary-main rounded-full 
                hover:scale-110 transition cursor-pointer"
                    />
                  </a>
                </div>
                <p className="col-span-5 px-8 text-justify text-headline font-semibold text-lg">
                  <SynopsisComponent
                    Synopsis={Synopsis.replace("[Written by MAL Rewrite]", "")}
                  />
                </p>
              </div>
              <TagsAnime Genres={Genre} Themes={Theme} />
              <SpecialInfo
                AgeRating={AgeRating}
                AlternativeTitle={AlternativeTitle}
                duration={type === "TV" && duration}
                studios={type === "Movie" && Studios}
              />
              <MyAnimes />
            </div>
          </div>
        </section>
        {/* Trailer */}
        <section className="bg-bgi-whiter w-5/6 flex flex-col items-center rounded-xl py-4">
          <h1 className="text-4xl font-bold tracking-wider text-headline mb-8">
            Trailer:
          </h1>
          <iframe
            width="560"
            height="315"
            className="rounded-xl ring-primary-main ring-4"
            src={trailer_url}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </section>
        {/* Episodes -> Render Only on Change */}
        {EpisodesData && (
          <section className="w-5/6 mt-2 py-4">
            <EpisodesSearchContext.Provider value={{ photoLink: photoPath }}>
              <EpisodesList Eps={EpisodesData} />
            </EpisodesSearchContext.Provider>
          </section>
        )}
        {/* Recommendation: anime/${id}/recommendations */}
        <section className="w-5/6 bg-bgi-whiter"></section>
      </div>
    </Fragment>
  );
};

function MyAnimes() {
  const {
    WATCHING,
    WATCHED,
    UNWATCHED,
    STALLED,
    WANT_TO_WATCH,
    WONT_WATCH,
    DROPPED,
  } = AnimeWatchType;
  const [SelectValue, setSelectValue] = useState(UNWATCHED);
  const FirstEffectSkipped = useRef(false);

  useEffect(() => {
    if (!FirstEffectSkipped.current) {
      FirstEffectSkipped.current = true;
      return;
    }
    // Action Change to FB
  }, [SelectValue]);

  return (
    <div className="flex justify-center mb-4">
      <div className="w-2/3">
        <p className="text-headline font-bold text-xl tracking-wide">
          MY ANIME:
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex justify-center"
        >
          <select
            value={SelectValue}
            onChange={(e) => setSelectValue(e.target.value as AnimeWatchType)}
            className="w-full bg-bgi-black text-headline text-center text-2xl outline-none focus:ring-2 focus:ring-primary-main
             rounded-lg py-3 px-1 transition"
          >
            <option value={UNWATCHED}>❌ Unwatched</option>
            <option value={WATCHING}>👀 Whatching</option>
            <option value={WATCHED}>✅ Watched</option>
            <option value={WANT_TO_WATCH}>⌚ Want to Watch</option>
            <option value={STALLED}>🙃 Stalled</option>
            <option value={DROPPED}>🚮 Dropped</option>
            <option value={WONT_WATCH}>⛔ Won&apos;t Watch</option>
          </select>
        </form>
      </div>
    </div>
  );
}

function SpecialInfo({
  AgeRating,
  AlternativeTitle,
  duration,
  studios,
}: SpecialInfoProps) {
  const TagsSpecialInfoData = [
    AgeRating.split("-").join("").replace(" ", "").replace(" ", ""),
    ...Object.keys(AlternativeTitle)
      .map((key) => AlternativeTitle[key].length > 0 && AlternativeTitle[key])
      .filter((data) => data),
    duration && `${duration.split(" ")[0]} Min/Eps`,
    studios && <StudiosComponent studio={studios[0]} />,
  ].filter((d) => d);
  const TagsSpecialInfo = TagsSpecialInfoData.map((data, i) => (
    <SpecialInfoItem dataToShow={data} key={i} />
  ));

  return (
    <div className="flex justify-center">
      <div className="w-2/3">
        <p className="text-headline font-bold text-lg underline">
          Special info:
        </p>
        <div className="flex justify-center flex-wrap">{TagsSpecialInfo}</div>
      </div>
    </div>
  );
}

function SpecialInfoItem({ dataToShow }: { dataToShow: string }) {
  return (
    <div className="text-headline cursor-default font-bold py-2 px-2 mr-2 bg-bgi-black rounded-lg mb-2 hover:text-primary-whiter hover:bg-bgi-darker transition">
      {dataToShow}
    </div>
  );
}

function TagsAnime({ Genres, Themes }: TagsAnimesProps) {
  const Tags = [...Genres, ...Themes].map(({ name, url }, i) => (
    <TagsAnimeItem key={i} name={name} url={url} />
  ));

  return (
    <div className="flex justify-center">
      <div className="mt-4 w-2/3">
        <p className="text-headline font-bold text-lg underline">Tags:</p>
        <div className="flex justify-center flex-wrap">{Tags}</div>
      </div>
    </div>
  );
}

function TagsAnimeItem({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-headline font-bold py-2 px-2 mr-2 bg-bgi-black rounded-lg mb-2 cursor-pointer hover:text-primary-whiter
       hover:bg-bgi-darker transition"
    >
      {name}
    </a>
  );
}

function SynopsisComponent({ Synopsis }: { Synopsis: string }) {
  return (
    <Fragment>
      {Synopsis}
      <br />
      <span className="text-description italic">
        Source: [Written by MAL Rewrite]
      </span>
    </Fragment>
  );
}

function StudiosComponent({ studio }: { studio: StudiosShape }) {
  return (
    <a href={studio?.url} target="_blank" rel="noreferrer">
      {studio?.name}
    </a>
  );
}

export default AnimeInfo;
