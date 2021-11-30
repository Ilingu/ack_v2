import React, { FC, Fragment } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
// Type
import {
  AnimeShape,
  JikanApiResAnime,
  AnimeConfigPathsIdShape,
} from "../../lib/types/interface";
import { JikanApiToAnimeShape, postToJSON } from "../../lib/utilityfunc";
// FB
import { doc, getDoc, writeBatch } from "@firebase/firestore";
import { db } from "../../lib/firebase";
// UI
import MetaTags from "../../components/Metatags";

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
  const { title, photoPath } = animeData;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Fragment>
      <MetaTags
        title={title}
        description={`${title} anime info page`}
        image={photoPath}
      />
      <div></div>
    </Fragment>
  );
};

export default AnimeInfo;
