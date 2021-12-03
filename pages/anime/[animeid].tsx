/* eslint-disable @next/next/no-img-element */
import React, { FC, Fragment, useCallback } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
// Type
import {
  AnimeShape,
  JikanApiResAnime,
  AnimeConfigPathsIdShape,
  StudiosShape,
} from "../../lib/types/interface";
import { JikanApiToAnimeShape, postToJSON } from "../../lib/utilityfunc";
// FB
import { doc, getDoc, writeBatch } from "@firebase/firestore";
import { db } from "../../lib/firebase";
// UI
import MetaTags from "../../components/Metatags";
import Loader from "../../components/Loader";
import { FaCalendarAlt, FaFilm, FaInfo, FaStar, FaTv } from "react-icons/fa";

/* Interface */
interface AnimeInfoProps {
  animeData: AnimeShape;
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
    const req = await fetch(`https://api.jikan.moe/v3/anime/${animeId}`);
    const animeRes: JikanApiResAnime = await req.json();

    if (animeRes && animeRes.status !== 404) {
      animeData = JikanApiToAnimeShape(animeRes);
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
    console.log(err);

    return {
      notFound: true,
    };
  }

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
                  <FaTv className="inline transform -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">{type}</span>{" "}
                  <span className="italic text-description text-xl">
                    ({nbEp} eps)
                  </span>
                </div>
                <div>
                  <FaStar className="inline text-yellow-500 transform -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">{OverallScore}</span>{" "}
                  <span className="italic text-description text-xl">
                    ({ScoredByTransform()} people)
                  </span>
                </div>
                <div>
                  <FaCalendarAlt className="inline transform -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">{ReleaseDate}</span>
                  <span className="italic text-description text-xl">
                    {Airing || " (Finished)"}
                  </span>
                </div>
                <div>
                  <FaFilm className="inline transform -translate-y-0.5" />{" "}
                  <span className="text-primary-whiter">
                    <StudiosComponent studio={Studios[0]} />
                  </span>
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
                      className="absolute -top-3 -left-3 text-headline font-bold w-12 h-12 py-2 px-2 bg-primary-main rounded-full transform 
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
            </div>
          </div>
        </section>
        <section className="bg-bgi-whiter w-5/6"></section>
        <section className="w-5/6"></section>
      </div>
    </Fragment>
  );
};

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
