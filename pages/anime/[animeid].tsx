/* eslint-disable @next/next/no-img-element */
import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GetStaticProps, GetStaticPaths, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
// Type
import type {
  AnimeShape,
  AnimeConfigPathsIdShape,
  Studio as StudioShape,
  GenreTag,
  AlternativeTitleShape,
  InternalApiResError,
  InternalApiResSuccess,
} from "../../lib/utils/types/interface";
import { AnimeWatchType } from "../../lib/utils/types/enums";
// Func
import { Return404 } from "../../lib/utils/UtilsFunc";
import { ConvertBroadcastTimeZone } from "../../lib/client/ClientFuncs";
import { GetAnimeData } from "../../lib/server/ApiFunc";
// FB
import AuthCheck from "../../components/Common/AuthCheck";
import { db as AdminDB } from "../../lib/firebase/firebase-admin";
// UI
import MetaTags from "../../components/Common/Metatags";
import Loader from "../../components/Design/Loader";
import EpisodesList from "../../components/Search/EpisodesList";
import RecommandationsList from "../../components/Search/RecommandationsList";
import AnimesWatchType from "../../components/Common/AnimesWatchType";
import {
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaInfo,
  FaStar,
  FaTv,
} from "react-icons/fa";
// Ctx
import { EpisodesSearchContext, GlobalAppContext } from "../../lib/context";
import { useMutation } from "../../lib/client/trpc";

/* Interface */
interface AnimeInfoProps {
  animeData: InternalApiResSuccess;
}
interface SpecialInfoProps {
  AgeRating: string;
  AlternativeTitle: AlternativeTitleShape;
  duration: string;
  studios: StudioShape[];
  OtherInfos: string[];
}
interface TagsAnimesProps {
  Genres: GenreTag[];
  Themes: GenreTag[];
}
interface MyAnimeProps {
  AnimeType: null | AnimeWatchType;
  malId: number;
}

const ReturnProps = (animeData: InternalApiResSuccess) => ({
  props: { animeData },
  revalidate: 600,
});

/* SSG */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { animeid: animeId } = params as { animeid: string };

  // Check on FB
  const animeFB = await AdminDB.collection("animes").doc(animeId).get();
  if (animeFB.exists) {
    const animeData = animeFB.data() as AnimeShape;

    if (!animeData?.NextRefresh || animeData?.NextRefresh > Date.now())
      return ReturnProps({
        AddedToDB: false,
        AnimeUpdated: false,
        AnimeData: animeData,
      });
  }

  // No Anime -> Api Req
  if (!animeId || typeof animeId !== "string" || isNaN(parseInt(animeId))) {
    console.error("Wrong AnimeID Params -> number");
    return Return404(60); // ❌
  }

  try {
    const SecureAnimeID = parseInt(animeId).toString();

    const JikanAnimeRes = await GetAnimeData(SecureAnimeID);
    if ((JikanAnimeRes as InternalApiResError).err === true) {
      if (animeFB.exists) {
        const AnimeData = animeFB.data() as AnimeShape;
        return ReturnProps({
          AddedToDB: false,
          AnimeUpdated: false,
          AnimeData,
        });
      }
      console.error(`Cannot Fetch Anime "${animeId}"`);
      return Return404(60);
    }

    const animeData = JikanAnimeRes as InternalApiResSuccess;
    return ReturnProps(animeData);
  } catch (err) {
    console.error(err);
    return Return404(60); // ❌
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all anime path name from DB
  const animesPaths = (
    await AdminDB.collection("animes").doc("animes-config").get()
  ).data() as AnimeConfigPathsIdShape;

  const paths = (animesPaths?.AllAnimeId || ["31478"]).map((doc) => ({
    params: { animeid: doc },
  }));

  return {
    paths,
    fallback: true,
  };
};

/* Components */
const AnimeInfo: NextPage<AnimeInfoProps> = ({ animeData }) => {
  const router = useRouter();
  const { UserAnimes, GlobalAnime } = useContext(GlobalAppContext);
  const [CurrentAnimeWatchType, setAnimeWatchType] = useState<AnimeWatchType>(
    () => AnimeWatchType.UNWATCHED
  );

  // Mutation
  const RevalidateAnimeMut = useMutation("animes.revalidate");

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
    malId,
    broadcast,
    Status,
    AiringDate,
    NextRefresh,
  } = animeData?.AnimeData || {};

  useEffect(() => {
    if (!NextRefresh || NextRefresh > Date.now()) return;

    // Revalidate If Anime Outdated
    process.env.NODE_ENV === "production" && RevalidateAnime(malId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [NextRefresh, malId]);

  useEffect(() => {
    if (UserAnimes && animeData) {
      const { malId } = animeData.AnimeData;
      const CurrentAnime =
        UserAnimes.find(({ AnimeId }) => AnimeId === malId) || null;

      setAnimeWatchType(CurrentAnime?.WatchType || null);
    }
  }, [UserAnimes, animeData, GlobalAnime]);

  const ScoredByTransform = useMemo((): string => {
    if (ScoredBy / 1000 >= 1) return `${(ScoredBy / 1000).toFixed(0)}K`;
    return ScoredBy?.toString();
  }, [ScoredBy]);

  const RevalidateAnime = async (AnimeID: number | string) => {
    console.warn(`Revalidating ${AnimeID}...`);

    AnimeID = parseInt(AnimeID.toString());
    if (isNaN(AnimeID)) return console.error(`Cannot Revalidate ${AnimeID}`);

    try {
      const success = await RevalidateAnimeMut.mutateAsync(AnimeID);

      if (!success) console.error(`Cannot Revalidate ${AnimeID}`);
      else console.log(`${AnimeID} revalidated with success`);
    } catch (err) {
      console.error(`Cannot Revalidate ${AnimeID}`);
    }
  };

  if (router.isFallback)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader show big />
      </div>
    );

  return (
    <div className="flex flex-col items-center py-2">
      <MetaTags
        title={title}
        description={`${title} anime info page`}
        image={photoPath.replace(".jpg", "t.jpg")}
      />
      {/* Overall Info */}
      <section className="relative lg:w-5/6">
        <h1 className="text-primary-main text-center text-4xl font-bold underline lg:text-left">
          {title}
        </h1>
        <div className="mt-6 flex flex-col items-center">
          <div className="xl:w-5/6">
            <div className="text-headline mb-6 grid grid-cols-2 justify-items-center gap-2 text-2xl font-bold md:grid-cols-4">
              <div>
                <FaTv className="icon" />{" "}
                <span className="text-primary-whiter">{type}</span>{" "}
                {type === "TV" && (
                  <span className="text-description text-xl italic">
                    ({nbEp} eps)
                  </span>
                )}
              </div>
              <div>
                <FaStar className="icon text-yellow-500" />{" "}
                <span className="text-primary-whiter">
                  {OverallScore || "No score yet"}
                </span>{" "}
                <span className="text-description text-xl italic">
                  {ScoredByTransform && `(${ScoredByTransform} people)`}
                </span>
              </div>
              <div>
                <FaCalendarAlt className="icon" />{" "}
                <span className="text-primary-whiter capitalize">
                  {Status === "Not yet aired" ? AiringDate : ReleaseDate}
                </span>
                <span className="text-description text-xl italic">
                  {Status === "Not yet aired"
                    ? " (Not yet aired)"
                    : Airing || " (Finished)"}
                </span>
              </div>
              <div>
                {Airing && broadcast ? (
                  <Fragment>
                    <FaClock className="icon" />{" "}
                    <span className="text-primary-whiter capitalize">
                      {ConvertBroadcastTimeZone(broadcast, "BroadcastFormated")}{" "}
                      UTC+1
                    </span>
                  </Fragment>
                ) : type === "TV" ? (
                  <Fragment>
                    <FaFilm className="icon" />{" "}
                    <span className="text-primary-whiter">
                      <StudiosComponent studio={Studios[0]} />
                    </span>
                  </Fragment>
                ) : (
                  <Fragment>
                    <FaClock className="icon" />{" "}
                    <span className="text-primary-whiter">
                      {duration?.toUpperCase()}
                    </span>
                  </Fragment>
                )}
              </div>
            </div>
            <div className="lg:grid lg:grid-cols-6">
              <div className="relative flex justify-center lg:col-span-1 lg:block">
                {UserAnimes &&
                CurrentAnimeWatchType &&
                CurrentAnimeWatchType !== AnimeWatchType.WONT_WATCH ? (
                  <Link href={`/watch/${malId}`} passHref>
                    <a>
                      <img
                        src={photoPath}
                        alt={`${title}'s cover`}
                        className="ring-primary-whiter rounded-md shadow-md ring-2"
                      />
                    </a>
                  </Link>
                ) : (
                  <img
                    src={photoPath}
                    alt={`${title}'s cover`}
                    className="ring-primary-whiter rounded-md shadow-md ring-2"
                  />
                )}{" "}
                <a href={MalPage} target="_blank" rel="noreferrer">
                  <FaInfo
                    className="left-info-bubble text-headline bg-primary-main absolute -top-3 h-12 w-12 cursor-pointer rounded-full 
                    py-2 px-2 font-bold transition hover:scale-110 lg:-left-3"
                  />
                </a>
              </div>
              <p className="text-headline xs:text-lg px-2 text-justify text-base font-semibold md:px-4 lg:col-span-5 lg:px-8">
                <SynopsisComponent
                  Synopsis={Synopsis?.replace("[Written by MAL Rewrite]", "")}
                />
              </p>
            </div>
            <TagsAnime Genres={Genre || []} Themes={Theme || []} />
            <SpecialInfo
              AgeRating={AgeRating}
              AlternativeTitle={AlternativeTitle}
              duration={type === "TV" && duration}
              studios={
                (Airing && broadcast) || type === "Movie" ? Studios : null
              }
              OtherInfos={[
                animeData?.AnimeData?.NineAnimeUrl || null,
                Airing && broadcast,
                Airing ? "Ongoing" : "Finished",
              ]}
            />
            <MyAnimes AnimeType={CurrentAnimeWatchType} malId={malId} />
          </div>
        </div>
      </section>
      {/* Trailer */}
      <section className="bg-bgi-whiter flex w-11/12 flex-col items-center rounded-xl py-4 lg:w-5/6">
        <h1 className="text-headline mb-8 text-4xl font-bold tracking-wider">
          Trailer:
        </h1>
        <iframe
          className="ring-primary-main sm:w-iframe-w sm:h-iframe-h rounded-xl ring-4"
          src={trailer_url}
          title="YouTube video player"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </section>
      {/* Episodes */}
      {EpisodesData && (
        <section className="mt-2 w-5/6 py-4">
          <EpisodesSearchContext.Provider value={{ photoLink: photoPath }}>
            <EpisodesList
              Eps={EpisodesData}
              NineAnimeBaseUrl={animeData?.AnimeData?.NineAnimeUrl}
            />
          </EpisodesSearchContext.Provider>
        </section>
      )}
      {/* Recommendation */}
      <section className="bg-bgi-whiter mt-2 w-5/6 rounded-xl py-4">
        <RecommandationsList
          RecommandationsData={Recommendations?.slice(0, 7)}
        />
      </section>
    </div>
  );
};

function MyAnimes({ malId, AnimeType }: MyAnimeProps) {
  return (
    <AuthCheck
      fallback={
        <MyAnimesCore>
          <Link href="/sign-up">
            <a>
              <div
                className="group bg-bgi-black text-headline w-full rounded-lg py-3 px-1 text-center 
             text-2xl font-semibold outline-none transition hover:text-red-400 hover:underline hover:decoration-red-500"
              >
                You{" "}
                <span className="font-bold tracking-wide text-red-400 group-hover:text-red-500">
                  must
                </span>{" "}
                be sign-in !
              </div>
            </a>
          </Link>
        </MyAnimesCore>
      }
    >
      <MyAnimesCore>
        <AnimesWatchType
          AnimeType={AnimeType}
          malId={malId}
          classNameProps="py-3"
        />
      </MyAnimesCore>
    </AuthCheck>
  );
}

function MyAnimesCore({ children }) {
  return (
    <div className="mb-4 flex justify-center">
      <div className="w-2/3">
        <p className="text-headline text-xl font-bold tracking-wide">
          MY ANIME:
        </p>
        {children}
      </div>
    </div>
  );
}

function SpecialInfo({
  AgeRating,
  AlternativeTitle,
  duration,
  studios,
  OtherInfos,
}: SpecialInfoProps) {
  const TagsSpecialInfoData = [
    ...OtherInfos,
    duration && `${duration?.split(" ")[0]} Min/Eps`,
    ...Object.keys(AlternativeTitle)
      .map(
        (key) =>
          AlternativeTitle[key] &&
          AlternativeTitle[key].length > 0 &&
          AlternativeTitle[key]
      )
      .filter((data) => data),
    studios && <StudiosComponent studio={studios[0]} />,
    AgeRating?.split("-").join("").replace(" ", "").replace(" ", ""),
  ].filter((d) => d);
  const TagsSpecialInfo = TagsSpecialInfoData.map((data, i) => (
    <SpecialInfoItem key={i} dataToShow={data} />
  ));

  return (
    <div className="flex justify-center">
      <div className="w-2/3">
        <p className="text-headline text-lg font-bold underline">
          Special info:
        </p>
        <div className="flex flex-wrap justify-center">{TagsSpecialInfo}</div>
      </div>
    </div>
  );
}

function SpecialInfoItem({ dataToShow }: { dataToShow: unknown }) {
  const Is9AnimeLink =
    typeof dataToShow === "string" && dataToShow?.startsWith("/watch/");
  return (
    <div
      className={`text-headline ${
        Is9AnimeLink ? "bg-[#5a2e98]" : "bg-bgi-black"
      } hover:text-primary-whiter hover:bg-bgi-darker mr-2 mb-2 cursor-default rounded-lg py-2 px-2 font-bold transition`}
    >
      {Is9AnimeLink ? <NineAnimeBadge path={dataToShow} /> : dataToShow}
    </div>
  );
}

function NineAnimeBadge({ path }: { path: string }) {
  return (
    <a
      href={`https://9anime.id${path}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-1"
    >
      <Image
        src="/Assets/9animeLogo.png"
        width={16}
        height={16}
        alt="9anime Logo"
        className="rounded-md bg-white"
      />
      9Anime
    </a>
  );
}

function TagsAnime({ Genres, Themes }: TagsAnimesProps) {
  const Tags = [...Genres, ...Themes].map(({ name, url }, i) => (
    <TagsAnimeItem key={i} name={name} url={url} />
  ));

  return (
    <div className="flex justify-center">
      <div className="mt-4 w-2/3">
        <p className="text-headline text-lg font-bold underline">Tags:</p>
        <div className="flex flex-wrap justify-center">{Tags}</div>
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
      className="text-headline bg-bgi-black hover:text-primary-whiter hover:bg-bgi-darker mr-2 mb-2 cursor-pointer rounded-lg py-2 px-2
       font-bold transition"
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

function StudiosComponent({ studio }: { studio: StudioShape }) {
  return (
    <a href={studio?.url} target="_blank" rel="noreferrer">
      {studio?.name}
    </a>
  );
}

export default AnimeInfo;
