/* eslint-disable @next/next/no-img-element */
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
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
  InternalApiResSuccess,
} from "../../lib/utils/types/interface";
import type { ProviderUIInfo } from "../../lib/utils/types/types";
import { AnimeWatchType } from "../../lib/utils/types/enums";
// Func
import {
  GenerateProviderUrl,
  GetProviderUIInfo,
  pickTextColorBasedOnBgColor,
  Return404,
} from "../../lib/utils/UtilsFuncs";
import { ConvertBroadcastTimeZone } from "../../lib/client/ClientFuncs";
import { GetAnimeData } from "../../lib/server/ApiFunc";
// FB
import AuthCheck from "../../components/Services/AuthCheck";
import { db as AdminDB } from "../../lib/firebase/firebase-admin";
// UI
import MetaTags from "../../components/Services/Metatags";
import Loader from "../../components/Design/Loader";
import EpisodesList from "../../components/pages/Search/EpisodesList";
import RecommandationsList from "../../components/pages/Search/RecommandationsList";
import AnimesWatchType from "../../components/Services/AnimesWatchType";
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
  /* if (animeFB.exists) {
    const animeData = animeFB.data() as AnimeShape;

    if (!animeData?.NextRefresh || animeData?.NextRefresh > Date.now())
      return ReturnProps({
        AddedToDB: false,
        AnimeUpdated: false,
        FromCache: true,
        AnimeData: animeData,
      });
  } */

  // No Anime -> Api Req
  if (!animeId || typeof animeId !== "string" || isNaN(parseInt(animeId))) {
    console.error("Wrong AnimeID Params -> number");
    return Return404(60); // ❌
  }

  try {
    const SecureAnimeID = parseInt(animeId).toString();

    const { success: SuccessApiFetch, data: JikanAnimeRes } =
      await GetAnimeData(SecureAnimeID);
    if (!SuccessApiFetch || !JikanAnimeRes || !JikanAnimeRes?.AnimeData) {
      if (animeFB.exists) {
        const AnimeData = animeFB.data() as AnimeShape;
        return ReturnProps({
          AddedToDB: false,
          AnimeUpdated: false,
          FromCache: true,
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
    YugenId,
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
      else console.warn(`${AnimeID} revalidated with success`);
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
        <h1 className="text-center text-4xl font-bold text-primary-main underline lg:text-left">
          {title}
        </h1>
        <div className="mt-6 flex flex-col items-center">
          <div className="xl:w-5/6">
            <div className="mb-6 grid grid-cols-2 justify-items-center gap-2 text-2xl font-bold text-headline md:grid-cols-4">
              <div>
                <FaTv className="icon" />{" "}
                <span className="text-primary-whiter">{type}</span>{" "}
                {type === "TV" && (
                  <span className="text-xl italic text-description">
                    ({nbEp} eps)
                  </span>
                )}
              </div>
              <div>
                <FaStar className="icon text-yellow-500" />{" "}
                <span className="text-primary-whiter">
                  {OverallScore || "No score yet"}
                </span>{" "}
                <span className="text-xl italic text-description">
                  {ScoredByTransform && `(${ScoredByTransform} people)`}
                </span>
              </div>
              <div>
                <FaCalendarAlt className="icon" />{" "}
                <span className="capitalize text-primary-whiter">
                  {Status === "Not yet aired" ? AiringDate : ReleaseDate}
                </span>
                <span className="text-xl italic text-description">
                  {Status === "Not yet aired"
                    ? " (Not yet aired)"
                    : Airing || " (Finished)"}
                </span>
              </div>
              <div>
                {Airing && broadcast ? (
                  <Fragment>
                    <FaClock className="icon" />{" "}
                    <span className="capitalize text-primary-whiter">
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
                        className="rounded-md shadow-md ring-2 ring-primary-whiter"
                      />
                    </a>
                  </Link>
                ) : (
                  <img
                    src={photoPath}
                    alt={`${title}'s cover`}
                    className="rounded-md shadow-md ring-2 ring-primary-whiter"
                  />
                )}{" "}
                <a href={MalPage} target="_blank" rel="noreferrer">
                  <FaInfo
                    className="absolute left-info-bubble -top-3 h-12 w-12 cursor-pointer rounded-full bg-primary-main py-2 
                    px-2 font-bold text-headline transition hover:scale-110 lg:-left-3"
                  />
                </a>
              </div>
              <p className="px-2 text-justify text-base font-semibold text-headline xs:text-lg md:px-4 lg:col-span-5 lg:px-8">
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
                YugenId ? GenerateProviderUrl(YugenId) : null,
                Airing && broadcast,
                Airing ? "Ongoing" : "Finished",
              ]}
            />
            {(animeData?.FromCache ||
              animeData?.AddedToDB ||
              animeData?.AnimeUpdated) && (
              <MyAnimes AnimeType={CurrentAnimeWatchType} malId={malId} />
            )}
          </div>
        </div>
      </section>
      {/* Trailer */}
      <section className="flex w-11/12 flex-col items-center rounded-xl bg-bgi-whiter py-4 lg:w-5/6">
        <h1 className="mb-8 text-4xl font-bold tracking-wider text-headline">
          Trailer:
        </h1>
        {process.env.NODE_ENV === "production" && (
          <iframe
            className="rounded-xl ring-4 ring-primary-main sm:h-iframe-h sm:w-iframe-w"
            src={trailer_url}
            title="YouTube video player"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        )}
      </section>
      {/* Episodes */}
      {EpisodesData && (
        <section className="mt-2 w-5/6 py-4">
          <EpisodesSearchContext.Provider value={{ photoLink: photoPath }}>
            <EpisodesList Eps={EpisodesData} YugenId={YugenId} />
          </EpisodesSearchContext.Provider>
        </section>
      )}
      {/* Recommendation */}
      <section className="mt-2 w-5/6 rounded-xl bg-bgi-whiter py-4">
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
                className="group w-full rounded-lg bg-bgi-black py-3 px-1 text-center text-2xl 
             font-semibold text-headline outline-none transition hover:text-red-400 hover:underline hover:decoration-red-500"
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
        <p className="text-xl font-bold tracking-wide text-headline">
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
        <p className="text-lg font-bold text-headline underline">
          Special info:
        </p>
        <div className="mt-1 flex flex-wrap justify-center">
          {TagsSpecialInfo}
        </div>
      </div>
    </div>
  );
}

function SpecialInfoItem({ dataToShow }: { dataToShow: unknown }) {
  const IsProviderLink =
    typeof dataToShow === "string" && dataToShow.includes("yugen.to");
  const UIInfo = IsProviderLink && GetProviderUIInfo();

  return (
    <>
      <div
        className={`mr-2 mb-2 cursor-default rounded-lg bg-bgi-black py-2 px-2 font-bold text-headline transition-all hover:bg-bgi-darker hover:text-primary-whiter${
          IsProviderLink ? " slideBtnAnimation" : ""
        }`}
      >
        {IsProviderLink ? (
          <ProviderAnimeBadge UIInfo={UIInfo} path={dataToShow} />
        ) : (
          dataToShow
        )}
      </div>
      <style jsx>{`
        div {
          background-color: ${IsProviderLink && UIInfo[0]};
          color: ${IsProviderLink && pickTextColorBasedOnBgColor(UIInfo[0])};
        }
      `}</style>
    </>
  );
}

interface ProviderAnimeBadgeProps {
  UIInfo: ProviderUIInfo;
  path: string;
}
function ProviderAnimeBadge({ UIInfo, path }: ProviderAnimeBadgeProps) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-1 capitalize"
    >
      <Image
        src={UIInfo[1]}
        width={20}
        height={20}
        alt="9anime Logo"
        className="rounded-md bg-white"
      />
      Yugen
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
        <p className="text-lg font-bold text-headline underline">Tags:</p>
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
      className="mr-2 mb-2 cursor-pointer rounded-lg bg-bgi-black py-2 px-2 font-bold text-headline transition
       hover:bg-bgi-darker hover:text-primary-whiter"
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
      <span className="italic text-description">
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
