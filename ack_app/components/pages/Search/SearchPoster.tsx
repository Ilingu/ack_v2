import { FC, Fragment, useContext } from "react";
import Image from "next/image";
import { SearchPosterContext } from "../../../lib/context";
// Types
import type { PosterSearchData } from "../../../lib/utils/types/interface";
// Icon
import { FaInfo, FaStar } from "react-icons/fa";
import Link from "next/link";
import { useEffect } from "react";
import { useState } from "react";

/* Interface */
interface AnimePosterProps {
  AnimeToTransform: PosterSearchData[];
}
interface AnimeItemProps {
  animeData: PosterSearchData;
}

const AnimePoster: FC<AnimePosterProps> = ({ AnimeToTransform }) => {
  const [RenderElements, setNewRender] = useState<JSX.Element[]>();

  useEffect(() => {
    const SearchPosters = AnimeToTransform.map((animeData, i) => (
      <AnimeItem key={i} animeData={animeData} />
    ));
    setNewRender(SearchPosters);
  }, [AnimeToTransform]);

  return <Fragment>{RenderElements}</Fragment>;
};

function AnimeItem({ animeData }: AnimeItemProps) {
  const { reqTitle } = useContext(SearchPosterContext);
  const enhanceWord = (title: string) =>
    title
      .toLowerCase()
      .replace(
        reqTitle.toLowerCase(),
        `<span class="text-primary-main font-bold">${reqTitle.toLowerCase()}</span>`
      );

  return (
    <div className="relative cursor-pointer">
      <Link href={`/anime/${animeData.malId}`} prefetch={false}>
        <a>
          <div className="group relative">
            <Image
              src={animeData?.photoPath}
              alt={`${animeData?.title}'s cover`}
              width="75%"
              height="100%"
              layout="responsive"
              objectFit="cover"
              loading="lazy"
              className="rounded-lg opacity-95 transition group-hover:opacity-50"
            />
            <button className="bg-primary-whiter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full py-2 px-2 opacity-0 transition ease-in hover:scale-110 group-hover:opacity-100">
              <FaInfo className="icon text-headline text-4xl font-bold" />
            </button>
          </div>
          <div className="text-headline bg-bgi-darker absolute top-1 left-1 rounded-lg bg-opacity-70 px-2 py-1 font-semibold">
            <FaStar className="icon text-yellow-500" />{" "}
            {animeData?.OverallScore}
          </div>
          <div className="text-headline bg-bgi-darker absolute top-1 right-1 rounded-lg bg-opacity-70 px-2 py-1 font-semibold">
            {animeData?.type}
          </div>
          <h1
            dangerouslySetInnerHTML={{ __html: enhanceWord(animeData?.title) }}
            className="text-headline text-center text-lg font-semibold capitalize"
          ></h1>
        </a>
      </Link>
    </div>
  );
}

export default AnimePoster;
